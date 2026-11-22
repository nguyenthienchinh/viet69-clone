import { Link } from 'react-router-dom'
import './VideoCard.css'

export interface Video {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  embedKind?: 'emb' | 'direct' | 'member'
  serverUuids?: string[]
  serverUrls?: (string | null)[]
  serverUrl?: string
  duration?: string
  views: number
  likes: number
  comments: number
  category: string
  categorySlug?: string
  tags: string[]
  author: {
    name: string
    avatar: string
    url: string
  }
  uploadDate: string
  description: string
  sourceUrl?: string
  realComments?: { name: string; text: string }[]
}

export interface VideoCardProps {
  video: Video
  variant?: 'default' | 'list'
}

function compact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`
  return String(n)
}

export function VideoCard({ video, variant = 'default' }: VideoCardProps) {
  if (variant === 'list') {
    return (
      <div className="video-card-list">
        <div className="video-card-thumb-list">
          <Link to={`/video/${video.id}`}>
            <img src={video.thumbnail} alt={video.title} loading="lazy" />
          </Link>
        </div>
        <div className="video-info-list">
          <h3 className="video-title-list">
            <Link to={`/video/${video.id}`} className="video-title-link">{video.title}</Link>
          </h3>
          <div className="video-meta-list">
            <Link to={video.author.url} className="author-name">{video.author.name}</Link>
            <span className="meta-separator">•</span>
            <span>{compact(video.views)} Views</span>
          </div>
          <p className="video-description">{video.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="video-card">
      <div className="video-card-thumb">
        <Link to={`/video/${video.id}`}>
          <img src={video.thumbnail} alt={video.title} loading="lazy" />
        </Link>
      </div>
      <p className="video-card-stats">
        <span>👁 {compact(video.views)}</span>
        <span>💬 {video.comments}</span>
        <span>👍 {compact(video.likes)}</span>
      </p>
      <Link to={`/video/${video.id}`} className="video-title">{video.title}</Link>
    </div>
  )
}