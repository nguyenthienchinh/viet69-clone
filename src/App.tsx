import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { DetailPage } from './pages/DetailPage'
import {
  AuthorIndexPage,
  AuthorPage,
  CategoryIndexPage,
  CategoryPage,
  SearchPage,
  TagIndexPage,
  TagPage,
} from './pages/ListPages'
import { NotFoundPage, StaticPage } from './pages/StaticPages'

function Footer() {
  return (
    <footer style={{ background: '#181818', borderTop: '1px solid #333', padding: 24, marginTop: 40, textAlign: 'center' }}>
      <nav style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/contact" style={{ color: '#e0e0e0' }}>Liên hệ</Link>
        <Link to="/about" style={{ color: '#e0e0e0' }}>Giới thiệu</Link>
        <Link to="/privacy" style={{ color: '#e0e0e0' }}>Chính sách bảo mật</Link>
        <Link to="/terms" style={{ color: '#e0e0e0' }}>Điều khoản sử dụng</Link>
      </nav>
      <p style={{ color: '#a0a0a0', fontSize: 13, marginTop: 12 }}>© 2026 VIET69 — Nền tảng chia sẻ video, chỉ dành cho người từ 18 tuổi.</p>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category" element={<CategoryIndexPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/video/:id" element={<DetailPage />} />
        <Route path="/tags" element={<TagIndexPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/authors" element={<AuthorIndexPage />} />
        <Route path="/author/:name" element={<AuthorPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/lienhe" element={<StaticPage pageKey="contact" />} />
        <Route path="/sex-viet" element={<Navigate to="/category/phim-sex-viet" replace />} />
        <Route path="/sinh-vien" element={<Navigate to="/category/sinh-vien" replace />} />
        <Route path="/teen" element={<Navigate to="/tag/teen" replace />} />
        <Route path="/check-hang" element={<Navigate to="/category/check-hang" replace />} />
        <Route path="/camera" element={<Navigate to="/category/camera" replace />} />
        <Route path="/bdsm" element={<Navigate to="/category/bdsm" replace />} />
        <Route path="/may-bay-ba-gia" element={<Navigate to="/category/may-bay-ba-gia" replace />} />
        <Route path="/thu-dam" element={<Navigate to="/tag/thu-dam" replace />} />
        <Route path="/bai-viet" element={<HomePage />} />
        <Route path="/xem-nhieu" element={<Navigate to="/?sort=xem-nhieu&page=1" replace />} />
        <Route path="/yeu-thich" element={<Navigate to="/?sort=yeu-thich&page=1" replace />} />
        <Route path="/binh-luan" element={<Navigate to="/?sort=binh-luan&page=1" replace />} />
        <Route path="/contact" element={<StaticPage pageKey="contact" />} />
        <Route path="/about" element={<StaticPage pageKey="about" />} />
        <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
        <Route path="/terms" element={<StaticPage pageKey="terms" />} />
        <Route path="/login" element={<StaticPage pageKey="login" />} />
        <Route path="/register" element={<StaticPage pageKey="register" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  )
}