import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { VideoCard, Video } from '../components/video/VideoCard'
import { usePageMeta } from '../components/layout/Breadcrumb'
import videosData from '../data/videos.json'
import tagsData from '../data/tags.json'
import './HomePage.css'

const VIDEOS = videosData as Video[]
const TAGS = tagsData as { name: string; slug: string; usageCount: number }[]
const PER_PAGE = 6

const SORTS = [
  { key: 'moi-nhat', label: 'Mới nhất' },
  { key: 'xem-nhieu', label: 'Lượt xem' },
  { key: 'yeu-thich', label: 'Lượt thích' },
  { key: 'binh-luan', label: 'Bình luận' },
]

function pageList(current: number, total: number): (number | '…')[] {
  const set = new Set<number>([1, total, current - 1, current, current + 1, current + 2])
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

export function HomePage() {
  const [params] = useSearchParams()
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort')! : 'moi-nhat'
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)

  usePageMeta({
    title: 'VIET69 - Tổng hợp phim sex Việt Nam',
    description: 'Dự án mẫu dựng lại bố cục trang chủ với dữ liệu giả lập.',
  })

  const sorted = useMemo(() => {
    const list = [...VIDEOS]
    if (sort === 'xem-nhieu') list.sort((a, b) => b.views - a.views)
    else if (sort === 'yeu-thich') list.sort((a, b) => b.likes - a.likes)
    else if (sort === 'binh-luan') list.sort((a, b) => b.comments - a.comments)
    else list.sort((a, b) => +new Date(b.uploadDate) - +new Date(a.uploadDate))
    return list
  }, [sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const current = Math.min(page, totalPages)
  const visible = sorted.slice((current - 1) * PER_PAGE, current * PER_PAGE)
  const href = (p: number, s = sort) => `/?sort=${s}&page=${p}`

  return (
    <div className="home-page">
      <main className="main-content">
        <div className="sort-bar">
          <span className="filter-label">Sắp xếp theo</span>
          <details className="sort-dropdown">
            <summary className="sort-current">
              {SORTS.find((s) => s.key === sort)?.label}
              <span className="sort-caret">⌄</span>
            </summary>
            <ul className="sort-list">
              {SORTS.map((s) => (
                <li key={s.key}>
                  <Link to={href(1, s.key)} className={`sort-item${s.key === sort ? ' active' : ''}`}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">Chưa có video nào.</p>
          </div>
        ) : (
          <div className="video-grid">
            {visible.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}

        <nav className="pagination" aria-label="Phân trang">
          <span className="pagination-info">Page {current} of {totalPages}</span>
          {pageList(current, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`d${i}`} className="page-dots">…</span>
            ) : (
              <Link key={p} to={href(p)} className={`page-num${p === current ? ' current' : ''}`}>
                {p}
              </Link>
            )
          )}
          {current < totalPages && <Link to={href(current + 1)} className="page-num">»</Link>}
          {current < totalPages && <Link to={href(totalPages)} className="page-num">Last »</Link>}
        </nav>
      </main>

      <aside className="sidebar-wrapper">
        <section className="tags-section">
          <h3 className="section-heading">Tags</h3>
          <div className="tags-cloud">
            {TAGS.map((t) => (
              <Link key={t.slug} to={`/tag/${t.slug}`} className="video-tag" title={`${t.usageCount} chủ đề`}>
                {t.name.trim()}
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}