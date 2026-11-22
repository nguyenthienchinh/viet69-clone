// Lấy comment thật từ trang gốc (viet69.be) của từng video và lưu vào data.
// - Mỗi video có sourceUrl: fetch trang gốc, parse các khối comment WordPress
//   (cite.fn = tên người bình luận, .comment-content = nội dung).
// - Lưu vào video.realComments = [{ name, text }] — chỉ trang đầu (đủ để hiển thị).
// Chạy lại được: video đã có realComments (kể cả rỗng) được bỏ qua.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as cheerio from 'cheerio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', 'src', 'data', 'videos.json')
const PROG = path.join(__dirname, '..', 'data', 'cache', 'comments-progress.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36'

const videos = JSON.parse(readFileSync(DATA, 'utf8'))
const progress = existsSync(PROG) ? JSON.parse(readFileSync(PROG, 'utf8')) : { done: 0, failed: 0 }

// Chỉ lấy video có sourceUrl và chưa có realComments
const targets = videos.filter((v) => v.sourceUrl && !Array.isArray(v.realComments))
console.log('Cần xử lý:', targets.length, '/', videos.length)

let done = progress.done
let failed = progress.failed
let sinceSave = 0
const CONC = 4
let idx = 0

function saveAll() {
  writeFileSync(DATA, JSON.stringify(videos))
  writeFileSync(PROG, JSON.stringify({ done, failed }))
}

async function fetchComments(url) {
  let res
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { headers: { 'user-agent': UA } })
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      continue
    }
    break
  }
  if (!res.ok) throw new Error('http ' + res.status)
  const $ = cheerio.load(await res.text())
  const out = []
  $('.comment-content').each((_, el) => {
    const text = $(el).text().trim()
    if (!text) return
    // comment-content nằm trong khối comment; tên ở cite.fn gần nhất phía trên
    const block = $(el).closest('.comment-inner, li.comment, .comment')
    const name = block.find('.comment-author cite.fn, cite.fn').first().text().trim() || 'Khách'
    out.push({ name, text })
  })
  return out
}

async function worker() {
  while (idx < targets.length) {
    const i = idx++
    const v = targets[i]
    try {
      v.realComments = await fetchComments(v.sourceUrl)
      done++
    } catch (e) {
      failed++
      if (failed % 100 === 1) console.log('Lỗi (bỏ qua):', v.id, '-', e.message)
    }
    sinceSave++
    if (sinceSave >= 200 || i + 1 === targets.length) {
      saveAll()
      sinceSave = 0
      console.log(`Tiến độ ${i + 1}/${targets.length} | ok ${done} | lỗi ${failed}`)
    }
  }
}

const t0 = Date.now()
await Promise.all(Array.from({ length: CONC }, worker))
saveAll()
console.log(`XONG sau ${Math.round((Date.now() - t0) / 1000)}s | ok ${done} | lỗi ${failed}`)
