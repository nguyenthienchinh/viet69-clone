// Lưu link phát cho video "emb": gọi API get-video của emb.cd-vs.com.
// - type 2 (blogger) -> link trang player không quảng cáo, nhúng iframe được => lưu vào serverUrls[i]
// - type 1 (m3u8)    -> link bị chặn theo Referer trên web khác => serverUrls[i] = null (UI dùng iframe embed thay thế)
// Chạy lại được: các video đã có serverUrls được bỏ qua.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '..', 'src', 'data', 'videos.json')
const PROG = path.join(__dirname, '..', 'data', 'cache', 'servers-progress.json')

const API = 'https://emb.cd-vs.com/api/get-video?id='
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36'

const videos = JSON.parse(readFileSync(DATA, 'utf8'))
const progress = existsSync(PROG) ? JSON.parse(readFileSync(PROG, 'utf8')) : { done: 0, failed: 0 }

// Chỉ xử lý video emb chưa có serverUrls
const targets = videos.filter(
  (v) => v.embedKind === 'emb' && Array.isArray(v.serverUuids) && v.serverUuids.length > 0 && !Array.isArray(v.serverUrls)
)
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

async function callApi(uuid) {
  const res = await fetch(API + uuid, { headers: { 'user-agent': UA } })
  if (res.status === 429 || res.status >= 500) {
    const e = new Error('http ' + res.status)
    e.retry = true
    throw e
  }
  if (!res.ok) throw new Error('http ' + res.status + ' (không retry)')
  return res.json()
}

async function resolveServers(v) {
  const out = []
  for (const uuid of v.serverUuids) {
    let info = null
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        info = await callApi(uuid)
        break
      } catch (e) {
        if (e.retry && attempt < 4) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
          continue
        }
        throw e
      }
    }
    if (info && info.type === 2 && info.url) out.push(info.url) // blogger: nhúng được, không quảng cáo
    else out.push(null) // m3u8: UI sẽ dùng iframe embed của nguồn
  }
  v.serverUrls = out
}

async function worker() {
  while (idx < targets.length) {
    const i = idx++
    const v = targets[i]
    try {
      await resolveServers(v)
      done++
    } catch (e) {
      failed++
      if (failed % 50 === 1) console.log('Lỗi (sẽ bỏ qua):', v.id, '-', e.message)
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
