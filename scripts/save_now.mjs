// Lưu data HIỆN TẠI trong data/cache/progress.json ra src/data/*.json + public/sitemap.xml
// (để build & xem thử khi crawl --full chưa chạy hết)
// Chạy: node scripts/save_now.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')
const PROGRESS_FILE = path.join(ROOT, 'data', 'cache', 'progress.json')

const CATEGORY_NAMES = {
  'sex-viet': 'Phim sex Việt',
  'sinh-vien': 'Sinh viên',
  teen: 'Teen',
  'check-hang': 'Check hàng',
  camera: 'Camera',
  bdsm: 'BDSM',
  'may-bay-ba-gia': 'Máy bay bà già',
  'thu-dam': 'Thủ dâm',
  'rau-non': 'Rau non',
  'bai-viet': 'Video thành viên',
}

function build(videos) {
  const cats = new Map()
  for (const v of videos) {
    if (!v.categorySlug || v.categorySlug === 'khac') continue
    if (!cats.has(v.categorySlug)) cats.set(v.categorySlug, { name: v.category, slug: v.categorySlug, count: 0 })
    cats.get(v.categorySlug).count++
  }
  const order = Object.keys(CATEGORY_NAMES)
  const categories = order.filter((s) => cats.has(s)).map((s) => cats.get(s))
  for (const [s, c] of cats) if (!order.includes(s)) categories.push(c)

  const tagCount = new Map()
  for (const v of videos) for (const t of v.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1)
  const tags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .map(([slug, count]) => ({ name: slug, slug, usageCount: count }))

  const authorCount = new Map()
  for (const v of videos) {
    const key = v.author.url
    if (!authorCount.has(key)) authorCount.set(key, { name: v.author.name, slug: key.replace('/author/', ''), count: 0 })
    authorCount.get(key).count++
  }
  const authors = [...authorCount.values()].sort((a, b) => b.count - a.count).slice(0, 200)

  return { categories, tags, authors }
}

const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
const videos = (p.videos || [])
  .slice()
  .sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))
const { categories, tags, authors } = build(videos)

fs.writeFileSync(path.join(DATA_DIR, 'videos.json'), JSON.stringify(videos, null, 2))
fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2))
fs.writeFileSync(path.join(DATA_DIR, 'tags.json'), JSON.stringify(tags, null, 2))
fs.writeFileSync(path.join(DATA_DIR, 'authors.json'), JSON.stringify(authors, null, 2))
console.log(`Lưu ${videos.length} video → src/data/*.json`)
