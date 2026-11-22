import { Link } from 'react-router-dom'
import categoriesData from '../../data/categories.json'
import tagsData from '../../data/tags.json'
import authorsData from '../../data/authors.json'
import './Sidebar.css'

interface Cat { name: string; slug: string }
interface Tag { name: string; slug: string; usageCount: number }
interface Author { name: string; slug: string }

const CATEGORIES = (categoriesData as Cat[]).slice(0, 6)
const TAGS = [...(tagsData as Tag[])].sort((a, b) => b.usageCount - a.usageCount).slice(0, 12)
const AUTHORS = (authorsData as Author[]).slice(0, 4)

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Thẻ phổ biến</h3>
        <div className="tags-cloud">
          {TAGS.map((tag) => (
            <Link key={tag.slug} to={`/tag/${tag.slug}`} className="tag-item">
              {tag.name.trim()} <span className="tag-count">{tag.usageCount.toLocaleString('vi-VN')}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Danh mục nổi bật</h3>
        <ul className="sidebar-list">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="sidebar-list-item">
              <Link to={`/category/${c.slug}`} className="sidebar-link">{c.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Tác giả nổi bật</h3>
        <ul className="sidebar-list">
          {AUTHORS.map((a) => (
            <li key={a.slug} className="sidebar-list-item">
              <Link to={`/author/${a.slug}`} className="sidebar-link">{a.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Liên kết</h3>
        <ul className="sidebar-list">
          <li className="sidebar-list-item"><Link to="/contact" className="sidebar-link">Liên hệ</Link></li>
          <li className="sidebar-list-item"><Link to="/about" className="sidebar-link">Giới thiệu</Link></li>
          <li className="sidebar-list-item"><Link to="/privacy" className="sidebar-link">Chính sách bảo mật</Link></li>
          <li className="sidebar-list-item"><Link to="/terms" className="sidebar-link">Điều khoản sử dụng</Link></li>
        </ul>
      </div>
    </aside>
  )
}