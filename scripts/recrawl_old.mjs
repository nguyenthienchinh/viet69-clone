// Dọn progress.json: giữ video parser MỚI (có embedKind), xoá video parser CŨ (embedType)
// khỏi `videos` và `done` để scraper re-crawl chúng bằng parser mới.
// Chạy: node scripts/recrawl_old.mjs   (khi crawl đang tạm dừng / chưa chạy)
import fs from 'node:fs'

const F = 'data/cache/progress.json'
const p = JSON.parse(fs.readFileSync(F, 'utf8'))
const keep = (p.videos || []).filter((v) => 'embedKind' in v)
const drop = (p.videos || []).length - keep.length

const done = {}
for (const v of keep) {
  if (v.sourceUrl) done[v.sourceUrl] = true
}

p.videos = keep
p.done = done
fs.writeFileSync(F, JSON.stringify(p))
console.log(`Giữ ${keep.length} video (parser mới). Sẽ re-crawl lại ${drop} video cũ.`)
