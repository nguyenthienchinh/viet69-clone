import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Video, VideoCard } from '../components/video/VideoCard'
import { usePageMeta } from '../components/layout/Breadcrumb'
import { NotFoundPage } from './StaticPages'
import { slugify } from '../utils'
import videosData from '../data/videos.json'
import { embUrl } from '../config'
import categoriesData from '../data/categories.json'
import tagsData from '../data/tags.json'
import './HomePage.css'
import './DetailPage.css'

const VIDEOS = videosData as Video[]
const TAGS = tagsData as { name: string; slug: string; usageCount: number }[]

interface Comment {
  id: number
  name: string
  text: string
}

const SAMPLE_COMMENTS: Comment[] = [
  { id: 1, name: 'Khách mẫu 1', text: 'Bình luận mẫu để minh họa bố cục.' },
  { id: 2, name: 'Khách mẫu 2', text: 'Đây là dữ liệu giả lập, không phải bình luận thật.' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildServers(video: Video): string[] {
  if (video.embedKind === 'emb' && video.serverUuids?.length) {
    return video.serverUuids.map((uuid, i) => video.serverUrls?.[i] ?? embUrl(uuid))
  }
  if (video.serverUrl) return [video.serverUrl]
  if (video.videoUrl) return [video.videoUrl]
  return []
}

function EmbedPlayer({ video }: { video: Video }) {
  const servers = buildServers(video)
  const [active, setActive] = useState(0)
  const isPage = video.embedKind === 'member'

  if (servers.length === 0) {
    return (
      <div className="player-placeholder">
        <span className="play-icon">▶</span>
        <span className="player-note">Chưa có video</span>
      </div>
    )
  }
  return (
    <>
      <div className="player-placeholder">
        <span className="play-icon" style={{ opacity: 0.6 }}>▶</span>
        <span className="player-note">Đang tải video... (không thấy? thử Server khác)</span>
      </div>
      <iframe
        key={active}
        className={`embed-player${isPage ? ' embed-player--page' : ''}`}
        src={servers[active]}
        title={video.title}
        referrerPolicy="no-referrer"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="eager"
      />
      {servers.length > 1 && (
        <div className="server-switch">
          {servers.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`server-btn${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              Server #{i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function DetailView({ video }: { video: Video }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(video.likes)
  const realComments: Comment[] = (video.realComments ?? [])
    .filter((c) => c.text)
    .map((c, i) => ({ id: i, name: c.name || 'Khách', text: c.text }))
  const [comments, setComments] = useState<Comment[]>(realComments.length > 0 ? realComments : SAMPLE_COMMENTS)
  const [name, setName] = useState('')
  const [text, setText] = useState('')

  usePageMeta({
    title: `${video.title} - VIET69`,
    description: video.description.slice(0, 150),
  })

  const catSlug =
    (categoriesData as { name: string; slug: string }[]).find((c) => c.name === video.category)?.slug ??
    slugify(video.category)

  const videoTagKeys = video.tags.map(slugify)
  const related = VIDEOS.filter(
    (v) =>
      v.id !== video.id &&
      (v.category === video.category || v.tags.some((t) => videoTagKeys.includes(slugify(t))))
  ).slice(0, 6)

  const date = new Date(video.uploadDate)

  const toggleLike = () => {
    setLikes((n) => (liked ? n - 1 : n + 1))
    setLiked(!liked)
  }

  const submitComment = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setComments((c) => [{ id: Date.now(), name: name.trim() || 'Khách', text: text.trim() }, ...c])
    setText('')
  }

  return (
    <div className="home-page detail-page">
      <main className="main-content">
        <article className="post-box">
          <div className="post-head">
            <div className="post-date">
              <span className="post-date-day">{String(date.getDate()).padStart(2, '0')}</span>
              <span className="post-date-month">{MONTHS[date.getMonth()]}</span>
            </div>
            <div className="post-head-text">
              <h2 className="siteheading">{video.title}</h2>
              <div className="post-meta">
                <Link to={video.author.url}>{video.author.name}</Link>
                <span> · </span>
                <Link to={`/category/${catSlug}`}>{video.category}</Link>
              </div>
            </div>
          </div>

          <div className="player-frame">
            <EmbedPlayer video={video} />
          </div>

          <div className="video-action-bar">
            <button type="button" className={`video-action__like${liked ? ' liked' : ''}`} onClick={toggleLike}>
              <span aria-hidden="true">👍</span>
              <span className="video-action__like-count">{likes.toLocaleString('vi-VN')}</span>
            </button>
            <span className="views-text">{video.views.toLocaleString('vi-VN')} lượt xem</span>
          </div>

          <p className="post-desc">{video.description}</p>

          <div className="post-tags">
            {video.tags.map((t) => (
              <Link key={t} to={`/tag/${slugify(t)}`} className="video-tag">
                {t.trim()}
              </Link>
            ))}
          </div>
        </article>

        <section className="section-box related-posts">
          <h3 className="section-title">You may also like</h3>
          {related.length === 0 ? (
            <p className="muted">Chưa có video liên quan.</p>
          ) : (
            <div className="related-grid">
              {related.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </section>

        <section className="respond">
          <h3 className="section-title">Leave a Reply</h3>
          <form className="comment-form" onSubmit={(e) => e.preventDefault()}>
            <input
              className="comment-input"
              placeholder="Tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="comment-input"
              rows={5}
              placeholder="Bình luận"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="comment-submit" onClick={submitComment}>
              Gửi bình luận
            </button>
          </form>
        </section>

        <section className="comments">
          <h2 className="section-title">{comments.length} Comments</h2>
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-item">
                <strong>{c.name}</strong>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <aside className="sidebar-wrapper">
        <section className="tags-section">
          <h3 className="section-heading">Tags</h3>
          <div className="tags-cloud">
            {TAGS.map((t) => (
              <Link key={t.slug} to={`/tag/${t.slug}`} className="video-tag">
                {t.name.trim()}
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const video = VIDEOS.find((v) => v.id === id)
  if (!video) return <NotFoundPage />
  return <DetailView key={video.id} video={video} />
}