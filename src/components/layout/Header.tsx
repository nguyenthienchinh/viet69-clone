import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import './Header.css'

const MENU = [
  { label: 'Phim sex Việt mới', to: '/sex-viet' },
  { label: 'Video của thành viên', to: '/bai-viet', badge: 'Mới' },
  { label: 'Phim sex sinh viên', to: '/sinh-vien' },
  { label: 'Teen', to: '/teen' },
  { label: 'Check hàng', to: '/check-hang' },
  { label: 'Camera', to: '/camera' },
  { label: 'BDSM', to: '/bdsm' },
  { label: 'Máy bay bà già', to: '/may-bay-ba-gia' },
  { label: 'Thủ dâm', to: '/thu-dam' },
  { label: 'Liên hệ', to: '/lienhe' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const close = () => setIsMenuOpen(false)
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" className="logo-link" onClick={close}>
            <span className="logo-icon">▶</span>
            <span className="logo-text">VIET69</span>
          </Link>
        </div>

        <div className="header-actions">
          <Link to="/login" className="nav-item nav-item-login">Đăng video</Link>
          <Link to="/register" className="nav-item nav-item-login">Đăng ký</Link>
          <Link to="/login" className="nav-item nav-item-register">Đăng nhập</Link>
          <button
            className="menu-toggle"
            aria-label="Mở menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <nav className={`main-nav${isMenuOpen ? ' open' : ''}`} aria-label="Menu chính">
        {MENU.map((m) => (
          <NavLink key={m.to} to={m.to} className="main-nav-item" onClick={close}>
            {m.label}
            {m.badge ? <span className="main-nav-badge">{m.badge}</span> : null}
          </NavLink>
        ))}
        <form
          className="nav-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
            if (q) {
              navigate(`/search?q=${encodeURIComponent(q)}`)
              close()
            }
          }}
        >
          <input name="q" type="search" placeholder="Tìm kiếm..." aria-label="Tìm kiếm" />
          <button type="submit">Tìm</button>
        </form>
      </nav>
    </header>
  )
}