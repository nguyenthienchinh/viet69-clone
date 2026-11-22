#!/usr/bin/env node
// Scraper viet69.be → src/data/*.json
// Cách chạy:
//   node scripts/scrape.mjs --limit 500    # crawl 500 video mới nhất (nhanh, để up trước)
//   node scripts/scrape.mjs --full         # crawl toàn bộ (~22.090 chính + ~2.424 thành viên)
//   node scripts/scrape.mjs --sync         # chỉ lấy video MỚI từ trang chủ, merge vào data
import * as cheerio from 'cheerio'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')
const CACHE_DIR = path.join(ROOT, 'data', 'cache')
const PROGRESS_FILE = path.join(CACHE_DIR, 'progress.json')

const BASE = 'https://viet69.be'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// slug danh mục -> tên hiển thị (đồng bộ với menu site)
const CATEGORY_NAMES = {
  'sex-viet': 'Phim sex Việt',
  'sinh-vien': 'Sinh viên',
  'teen': 'Teen',
  'check-hang': 'Check hàng',
  'camera': 'Camera',
  'bdsm': 'BDSM',
  'may-bay-ba-gia': 'Máy bay bà già',
  'thu-dam': 'Thủ dâm',
  'rau-non': 'Rau non',
  'bai-viet': 'Video thành viên',
}

// ---------------- Helpers ----------------
function parseCount(s) {
  if (!s) return 0
  s = String(s).trim()
  const m = s.match(/([\d.,]+)\s*([KMB]?)/i)
  if (!m) return 0
  let n = parseFloat(m[1].replace(/,/g, ''))
  if (Number.isNaN(n)) return 0
  const suf = (m[2] || '').toUpperCase()
  if (suf === 'K') n *= 1e3
  else if (suf === 'M') n *= 1e6
  else if (suf === 'B') n *= 1e9
  return Math.round(n)
}

function decodeB64(s) {
  try {
    return Buffer.from(s, 'base64').toString('utf8')
  } catch {
    return s
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function fetchText(url, { referer, retries = 5, timeoutMs = 20000 } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), timeoutMs)
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, ...(referer ? { Referer: referer } : {}) },
        signal: ctrl.signal,
      })
      clearTimeout(t)
      if (res.ok) return res.text()
      if (res.status === 404) return null
      // 429 = bị giới hạn -> chờ lâu hơn rồi thử lại
      if (res.status === 429 && i < retries) {
        await sleep(1500 * (i + 1))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      if (i === retries) return null // bỏ qua URL lỗi, không crash cả crawl
      await sleep(800 * (i + 1))
    }
  }
  return null
}

function parseSitemapIndex(xml) {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  return locs.filter((l) => l.endsWith('.xml'))
}

function parseSitemap(xml) {
  const items = []
  const re = /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g
  let m
  while ((m = re.exec(xml))) {
    items.push({ loc: m[1], lastmod: m[2] || '' })
  }
  return items
}

// ---------------- Parse detail page ----------------
export function parseVideoDetail(html, url, { isMember } = {}) {
  const $ = cheerio.load(html)
  const slug = url.split('/').filter(Boolean).pop()

  const ogTitle = ($('meta[property="og:title"]').attr('content') || '').trim()
  const title = ogTitle.replace(/ - Viet69$/i, '').replace(/ - +$/, '').trim()
  let description = (
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim()

  let thumbnail = ($('meta[property="og:image"]').attr('content') || '').trim()

  // video: xác định loại + 2 server
  let embedKind
  let serverUuids = []
  let serverUrl = ''
  const movieB64 = $('.movieLoader').attr('data-movie')
  if (movieB64) {
    // video emb: Server #1 từ data-movie + các server còn lại từ data-video (dedup)
    embedKind = 'emb'
    serverUuids.push(decodeB64(movieB64))
    // tìm MỌI data-video trong trang (nằm trong .movieLoader-server, là sibling của movieLoader)
    const b64s = [...new Set([...html.matchAll(/data-video="([^"]+)"/g)].map((m) => m[1]))]
    for (const b of b64s) {
      const u = decodeB64(b)
      if (u && !serverUuids.includes(u)) serverUuids.push(u)
    }
  } else {
    const dsrc = $('video[data-src]').attr('data-src')
    const ic = $('.entry-content iframe').first().attr('src') || $('iframe').first().attr('src')
    if (dsrc) {
      // video thành viên: HLS -> iframe trang gốc
      embedKind = 'member'
      serverUrl = url
    } else if (ic) {
      // video cũ: iframe trực tiếp (xvideos...)
      embedKind = 'direct'
      serverUrl = ic
    } else {
      embedKind = 'member'
      serverUrl = url
    }
  }

  if (!thumbnail) {
    thumbnail =
      $('img[src*="vscd.net/images"]').first().attr('src') ||
      $('img').first().attr('src') ||
      ''
  }
  thumbnail = thumbnail.replace(/class=large/g, 'width=500')

  // category + tags từ class của bài chính
  const main = $('div.post.type-post').not('.item-video').first()
  const classes = (main.attr('class') || '').split(/\s+/).filter(Boolean)
  const catSlug =
    classes.find((c) => c.startsWith('category-'))?.replace('category-', '') || ''
  const tags = classes.filter((c) => c.startsWith('tag-')).map((c) => c.replace('tag-', ''))

  // author + date từ entry-meta của bài chính
  const entryMeta = main.find('.entry-meta').first()
  let authorName = (entryMeta.find('a[rel="author"]').first().text() || '').trim()
  let authorHref = (entryMeta.find('a[rel="author"]').first().attr('href') || '').trim()
  if (!authorName) {
    authorName = ($('a[rel="author"]').first().text() || '').trim()
    authorHref = ($('a[rel="author"]').first().attr('href') || '').trim()
  }

  let date = ''
  const onMatch = entryMeta.text().match(/on\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (onMatch) {
    date = `${onMatch[3]}-${onMatch[2].padStart(2, '0')}-${onMatch[1].padStart(2, '0')}T00:00:00+00:00`
  }
  if (!date) {
    const d = html.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (d) date = `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}T00:00:00+00:00`
  }

  // stats: nằm SAU player = video chính (anchor: movieLoader hoặc iframe)
  let views = 0
  let comments = 0
  let likes = 0
  let anchor = html.indexOf('movieLoader" data-movie')
  if (anchor < 0) {
    const p = html.indexOf('<iframe')
    anchor = p >= 0 ? p : 0
  }
  {
    const frag = cheerio.load(html.slice(anchor, anchor + 7000))
    views = parseCount(frag('.views .count').first().text() || '0')
    comments =
      parseInt(((frag('.comments .count').first().text() || '0').replace(/[^\d]/g, '')) || '0') || 0
    likes =
      parseInt(((frag('.video-action__like-count').first().text() || '').replace(/[^\d]/g, '')) || '0') || 0
    frag('[data-pid]').each((_, el) => {
      if (!likes) {
        const t = parseInt(((frag(el).text() || '').replace(/[^\d]/g, '')) || '0')
        if (t) likes = t
      }
    })
  }

  // author fallback
  if (!authorName && isMember) {
    const em = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    authorName = em ? em[1] : 'Thành viên'
  }
  if (!authorName) authorName = 'admin'
  const authorUser =
    (authorHref.match(/author\/([^/]+)\/?/)?.[1]) ||
    authorName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 30) ||
    'admin'

  return {
    id: slug,
    title,
    thumbnail,
    embedKind,
    serverUuids,
    serverUrl,
    sourceUrl: url,
    videoUrl:
      embedKind === 'emb'
        ? `https://emb.cd-vs.com/embed/${serverUuids[0]}`
        : serverUrl,
    duration: '',
    views,
    likes,
    comments,
    category: CATEGORY_NAMES[catSlug] || (isMember ? 'Video thành viên' : 'Khác'),
    categorySlug: catSlug || (isMember ? 'bai-viet' : 'khac'),
    tags,
    author: { name: authorName, avatar: '', url: `/author/${authorUser}` },
    uploadDate: date,
    description,
    sourceUrl: url,
  }
}

// ---------------- Load/save data ----------------
export function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
  } catch {
    return fallback
  }
}

function saveVideos(videos) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, 'videos.json'), JSON.stringify(videos, null, 2))
}

function buildTagAuthorCategory(videos) {
  // categories.json
  const cats = new Map()
  for (const v of videos) {
    if (!v.categorySlug || v.categorySlug === 'khac') continue
    if (!cats.has(v.categorySlug)) cats.set(v.categorySlug, { name: v.category, slug: v.categorySlug, count: 0 })
    cats.get(v.categorySlug).count++
  }
  // thứ tự theo menu
  const order = Object.keys(CATEGORY_NAMES)
  const categories = order
    .filter((s) => cats.has(s))
    .map((s) => cats.get(s))
  // thêm category còn lại
  for (const [s, c] of cats) if (!order.includes(s)) categories.push(c)

  // tags.json (top by usage)
  const tagCount = new Map()
  for (const v of videos) for (const t of v.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1)
  const tags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .map(([slug, count]) => ({ name: slug, slug, usageCount: count }))

  // authors.json
  const authorCount = new Map()
  for (const v of videos) {
    const key = v.author.url
    if (!authorCount.has(key)) authorCount.set(key, { name: v.author.name, slug: key.replace('/author/', ''), count: 0 })
    authorCount.get(key).count++
  }
  const authors = [...authorCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 200)
    .map((a) => ({ name: a.name, slug: a.slug, count: a.count }))

  return { categories, tags, authors }
}

export function saveAll(videos) {
  const { categories, tags, authors } = buildTagAuthorCategory(videos)
  fs.writeFileSync(path.join(DATA_DIR, 'videos.json'), JSON.stringify(videos, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, 'tags.json'), JSON.stringify(tags, null, 2))
  fs.writeFileSync(path.join(DATA_DIR, 'authors.json'), JSON.stringify(authors, null, 2))
  generateSitemap(videos, categories, tags)
}

function generateSitemap(videos, categories, tags) {
  const pub = 'https://viet69-clone.example.com'
  const urls = []
  urls.push(`<url><loc>${pub}/</loc><priority>1.0</priority></url>`)
  urls.push(`<url><loc>${pub}/category</loc><priority>0.8</priority></url>`)
  for (const c of categories) urls.push(`<url><loc>${pub}/category/${c.slug}</loc><priority>0.7</priority></url>`)
  for (const v of videos) {
    const lm = v.uploadDate ? `<lastmod>${v.uploadDate}</lastmod>` : ''
    urls.push(`<url><loc>${pub}/video/${v.id}</loc>${lm}<priority>0.6</priority></url>`)
  }
  for (const t of tags.slice(0, 100)) urls.push(`<url><loc>${pub}/tag/${t.slug}</loc><priority>0.4</priority></url>`)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
  fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true })
  fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml)
  console.log(`  sitemap.xml: ${urls.length} URL`)
}

// ---------------- Crawl URL list from sitemaps ----------------
export async function getMainVideoUrls() {
  const index = await fetchText(`${BASE}/sitemap_index.xml`)
  const child = parseSitemapIndex(index)
  const postMaps = child.filter((u) => u.includes('post-sitemap'))
  let all = []
  for (const u of postMaps) {
    const xml = await fetchText(u)
    if (xml) all = all.concat(parseSitemap(xml))
  }
  return all
}

export async function getMemberVideoUrls() {
  const index = await fetchText(`${BASE}/sitemap-custom/baiviet-sitemap-index.xml`)
  if (!index) return []
  const child = parseSitemapIndex(index)
  let all = []
  for (const u of child) {
    const xml = await fetchText(u)
    if (xml) all = all.concat(parseSitemap(xml))
  }
  return all
}

// ---------------- Worker pool ----------------
async function mapPool(items, worker, { concurrency = 4, onProgress } = {}) {
  const results = new Array(items.length)
  let next = 0
  let done = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = await worker(items[i], i)
      } catch (e) {
        results[i] = null
      }
      if (onProgress && ++done % 25 === 0) onProgress(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

// ---------------- Modes ----------------
async function crawlDetail(url, isMember) {
  const html = await fetchText(url)
  if (!html) return null
  const v = parseVideoDetail(html, url, { isMember })
  if (!v.title) return null
  return v
}

async function modeFull({ limit, newestOnly = true } = {}) {
  console.log('Lấy danh sách URL video chính từ sitemap...')
  const mainUrls = await getMainVideoUrls()
  console.log(`  video chính: ${mainUrls.length}`)
  console.log('Lấy danh sách URL video thành viên...')
  const memberUrls = await getMemberVideoUrls()
  console.log(`  video thành viên: ${memberUrls.length}`)

  // sắp mới nhất trước (lastmod)
  const all = [
    ...mainUrls.map((u) => ({ ...u, isMember: false })),
    ...memberUrls.map((u) => ({ ...u, isMember: true })),
  ].sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''))

  const toCrawl = limit ? all.slice(0, limit) : all
  console.log(`Crawl ${toCrawl.length} video (newest-first)...`)

  // resume
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  let progress = {}
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
  } catch {}
  const done = progress.done || {}
  const results = progress.videos || []
  const pending = toCrawl.filter((u) => !done[u.loc])
  console.log(`  còn lại: ${pending.length} (đã có: ${results.length})`)

  let lastSave = 0
  await mapPool(pending, async (u) => {
    const v = await crawlDetail(u.loc, u.isMember)
    if (v) {
      results.push(v)
      done[u.loc] = 1
    }
    // save mỗi 50
    if (results.length - lastSave >= 50) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ done, videos: results }))
      lastSave = results.length
    }
  }, {
    concurrency: 4,
    onProgress: (d, total) => {
      if (d % 100 < 4) console.log(`  ...${d}/${total} (${results.length} ok)`)
    },
  })

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ done, videos: results }))
  results.sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
  saveAll(results)
  console.log(`XONG: ${results.length} video → src/data/*.json`)
}

async function modeSync() {
  console.log('Sync: fetch trang chủ để tìm video mới...')
  const html = await fetchText(`${BASE}/`)
  const $ = cheerio.load(html)
  const cards = $('a.clip-link')
  const found = []
  cards.each((_, el) => {
    const a = $(el)
    const url = a.attr('href')
    if (!url) return
    const parent = a.closest('div[id^="post-"]')
    const id = a.attr('data-id')
    found.push({ id, url, isMember: url.includes('/bai-viet/') })
  })
  console.log(`  tìm thấy ${found.length} video trên trang chủ`)

  const videos = loadJson('videos.json', [])
  const have = new Set(videos.map((v) => v.id))
  const news = found.filter((f) => !have.has(slugFromUrl(f.url)))
  console.log(`  video mới: ${news.length}`)

  const fresh = []
  for (const n of news) {
    const v = await crawlDetail(n.url, n.isMember)
    if (v) fresh.push(v)
    await sleep(200)
  }

  // merge
  const map = new Map(videos.map((v) => [v.id, v]))
  for (const v of fresh) map.set(v.id, v)
  const merged = [...map.values()].sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
  saveAll(merged)
  console.log(`SYNC XONG: thêm ${fresh.length}, tổng ${merged.length} video`)
}

export function slugFromUrl(url) {
  return url.split('/').filter(Boolean).pop()
}

// ---------------- Main ----------------
// Chỉ chạy khi gọi trực tiếp (node scripts/scrape.mjs ...), không chạy khi bị import
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const args = process.argv.slice(2)
  const hasFlag = (f) => args.includes(f)
  const getOpt = (f) => {
    const i = args.indexOf(f)
    return i >= 0 ? args[i + 1] : null
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true })

  if (hasFlag('--sync')) {
    await modeSync()
  } else if (hasFlag('--full')) {
    await modeFull({})
  } else if (hasFlag('--limit')) {
    await modeFull({ limit: parseInt(getOpt('--limit') || '500') })
  } else {
    console.log('Dùng: --limit 500 | --full | --sync')
    process.exit(1)
  }
}
