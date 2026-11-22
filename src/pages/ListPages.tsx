import { Link, useParams, useSearchParams } from 'react-router-dom'
import { VideoCard, Video } from '../components/video/VideoCard'
import { Sidebar } from '../components/layout/Sidebar'
import { Breadcrumb, usePageMeta } from '../components/layout/Breadcrumb'
import { slugify } from '../utils'
import videosData from '../data/videos.json'
import categoriesData from '../data/categories.json'
import tagsData from '../data/tags.json'
import authorsData from '../data/authors.json'
import './HomePage.css'

const VIDEOS = videosData as Video[]

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-page">
      <main className="main-content">{children}</main>
      <aside className="sidebar-wrapper">
        <Sidebar />
      </aside>
    </div>
  )
}

function Grid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-text">Không tìm thấy video phù hợp.</p>
        <Link to="/" className="empty-link">Về trang chủ</Link>
      </div>
    )
  }
  return (
    <div className="video-grid">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  )
}

export function CategoryPage() {
  const { slug = '' } = useParams()
  const key = slugify(decodeURIComponent(slug))
  const videos = VIDEOS.filter((v) => slugify(v.category) === key || v.categorySlug === key)
  const cat = (categoriesData as { name: string; slug: string }[]).find(
    (c) => slugify(c.slug) === key || slugify(c.name) === key
  )
  const name = cat?.name ?? decodeURIComponent(slug)
  usePageMeta({ title: `${name} - VIET69`, description: `Video thuộc danh mục ${name}.` })
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Danh mục', to: '/category' }, { label: name }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>{name}</h1>
      <Grid videos={videos} />
    </Shell>
  )
}

export function CategoryIndexPage() {
  usePageMeta({ title: 'Danh mục - VIET69', description: 'Tất cả danh mục video.' })
  const cats = categoriesData as { name: string; slug: string }[]
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Danh mục' }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Danh mục</h1>
      <div className="tags-cloud" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {cats.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`} className="video-tag" style={{ padding: '10px 16px', fontSize: 15 }}>
            {c.name}
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function TagPage() {
  const { slug = '' } = useParams()
  const key = slugify(decodeURIComponent(slug))
  const videos = VIDEOS.filter((v) => v.tags.some((t) => slugify(t) === key))
  const tagName =
    (tagsData as { name: string; slug: string }[]).find((t) => slugify(t.slug) === key || slugify(t.name) === key)?.name.trim() ??
    decodeURIComponent(slug)
  usePageMeta({ title: `Thẻ ${tagName} - VIET69`, description: `${videos.length} video mẫu gắn thẻ ${tagName}.` })
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Thẻ', to: '/tags' }, { label: decodeURIComponent(slug) }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Thẻ: {decodeURIComponent(slug)}</h1>
      <Grid videos={videos} />
    </Shell>
  )
}

export function TagIndexPage() {
  usePageMeta({ title: 'Thẻ - VIET69', description: 'Tất cả thẻ phổ biến.' })
  const tags = tagsData as { name: string; slug?: string; usageCount?: number }[]
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Thẻ' }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Thẻ</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {tags.map((t) => (
          <Link key={t.name} to={`/tag/${t.slug ?? slugify(t.name)}`} className="video-tag" style={{ padding: '10px 16px', fontSize: 15 }}>
            {t.name}
            {t.usageCount != null ? ` (${t.usageCount})` : ''}
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function AuthorPage() {
  const { name = '' } = useParams()
  const key = decodeURIComponent(name).toLowerCase()
  const videos = VIDEOS.filter((v) => v.author.url.toLowerCase().endsWith(`/${key}`))
  const display = videos[0]?.author.name ?? decodeURIComponent(name)
  usePageMeta({ title: `${display} - VIET69`, description: `Video của tác giả ${display}.` })
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Tác giả', to: '/authors' }, { label: display }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>{display}</h1>
      <Grid videos={videos} />
    </Shell>
  )
}

export function AuthorIndexPage() {
  usePageMeta({ title: 'Tác giả - VIET69', description: 'Danh sách tác giả.' })
  const authors = authorsData as { name: string; slug: string }[]
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Tác giả' }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>Tác giả</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {authors.map((a) => (
          <Link key={a.name} to={`/author/${a.slug}`} className="video-tag" style={{ padding: '10px 16px', fontSize: 15 }}>
            {a.name}
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const key = slugify(q)
  const videos = key
    ? VIDEOS.filter((v) =>
        [v.title, v.description, v.category, ...v.tags, v.author.name].some((s) => slugify(s).includes(key))
      )
    : []
  usePageMeta({ title: `Tìm kiếm: ${q} - VIET69`, description: `Kết quả tìm kiếm cho ${q}.` })
  return (
    <Shell>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Tìm kiếm' }]} />
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        {q ? `Kết quả cho "${q}" (${videos.length})` : 'Nhập từ khóa để tìm kiếm'}
      </h1>
      {q ? <Grid videos={videos} /> : null}
    </Shell>
  )
}