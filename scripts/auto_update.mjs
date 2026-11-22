// Tự cập nhật video MỚI từ viet69.be vào data, rồi chạy comment + server cho video mới.
// Chạy được nhiều lần (chỉ crawl những video chưa có trong src/data/videos.json).
//
// Cách chạy:
//   node scripts/auto_update.mjs              # crawl tối đa 200 video mới nhất, rồi comment + server
//   node scripts/auto_update.mjs --limit 50   # giới hạn số video crawl mỗi lần
//   node scripts/auto_update.mjs --no-extras  # chỉ crawl video, không chạy comment/server
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  parseVideoDetail,
  getMainVideoUrls,
  getMemberVideoUrls,
  fetchText,
  loadJson,
  saveAll,
  slugFromUrl,
} from './scrape.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_DIR = path.join(ROOT, 'data', 'cache')

const args = process.argv.slice(2)
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1] || '200') : 200
const noExtras = args.includes('--no-extras')

// 1. Lấy toàn bộ URL video từ sitemap nguồn
console.log('[1/4] Lấy danh sách URL từ sitemap...')
const mainUrls = await getMainVideoUrls()
const memberUrls = await getMemberVideoUrls()
console.log(`  chính: ${mainUrls.length} | thành viên: ${memberUrls.length}`)

// 2. Tìm video mới (chưa có trong data), sắp mới nhất trước theo lastmod
const videos = loadJson('videos.json', [])
const have = new Set(videos.map((v) => v.id))
const seen = new Map()
for (const u of [...memberUrls.map((u) => ({ ...u, isMember: true })), ...mainUrls]) {
  const id = slugFromUrl(u.loc)
  if (!have.has(id) && !seen.has(id)) {
    seen.set(id, { url: u.loc, isMember: !!u.isMember, lastmod: u.lastmod || '' })
  }
}
const allNew = [...seen.values()].sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''))
const toCrawl = allNew.slice(0, limitArg)
console.log(`[2/4] Video mới chưa có: ${allNew.length} — crawl tối đa ${toCrawl.length}`)

// 3. Crawl chi tiết video mới (song song 4, bỏ qua lỗi không crash)
const fresh = []
let idx = 0
async function worker() {
  while (idx < toCrawl.length) {
    const i = idx++
    const item = toCrawl[i]
    try {
      const html = await fetchText(item.url)
      if (!html) continue
      const v = parseVideoDetail(html, item.url, { isMember: item.isMember })
      if (v && v.title) {
        fresh.push(v)
        console.log(`  + ${v.id}`)
      }
    } catch (e) {
      console.log(`  lỗi bỏ qua: ${item.url} (${e.message})`)
    }
    if (fresh.length % 10 === 0) console.log(`  ...đã crawl ${fresh.length}/${toCrawl.length}`)
  }
}
if (toCrawl.length > 0) {
  await Promise.all(Array.from({ length: 4 }, worker))
}

// Merge vào data (giữ nguyên video cũ, thêm video mới, sắp mới nhất trước)
const map = new Map(videos.map((v) => [v.id, v]))
for (const v of fresh) map.set(v.id, v)
const merged = [...map.values()].sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
console.log(`[3/4] Thêm ${fresh.length} video mới → tổng ${merged.length}`)
if (fresh.length > 0) {
  saveAll(merged)
}

// 4. Chạy comment + link server cho video mới (2 script này tự bỏ qua video đã có)
if (noExtras) {
  console.log('[4/4] Bỏ qua comment/server (--no-extras)')
} else {
  mkdirSync(CACHE_DIR, { recursive: true })
  if (fresh.length > 0) {
    console.log('[4/4a] Lấy comment cho video mới...')
    spawnSync(process.execPath, [path.join(__dirname, 'scrape_comments.mjs')], { stdio: 'inherit' })
    console.log('[4/4b] Lấy link server cho video mới...')
    spawnSync(process.execPath, [path.join(__dirname, 'scrape_servers.mjs')], { stdio: 'inherit' })
  } else {
    console.log('[4/4] Không có video mới — bỏ qua comment/server')
  }
}
console.log(`XONG: +${fresh.length} video, tổng ${merged.length}`)
