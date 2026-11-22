import { Link, useParams } from 'react-router-dom'
import { Breadcrumb, usePageMeta } from '../components/layout/Breadcrumb'

const PAGES: Record<string, { title: string; body: string }> = {
  contact: { title: 'Liên hệ', body: 'Trang liên hệ mẫu. Email: contact@example.com (placeholder).' },
  about: { title: 'Giới thiệu', body: 'Đây là dự án mẫu dựng giao diện tương tự nền tảng video, dùng dữ liệu giả lập.' },
  privacy: { title: 'Chính sách bảo mật', body: 'Nội dung chính sách bảo mật mẫu (placeholder).' },
  terms: { title: 'Điều khoản sử dụng', body: 'Nội dung điều khoản sử dụng mẫu (placeholder). Chỉ dành cho người từ 18 tuổi trở lên.' },
  login: { title: 'Đăng nhập', body: 'Biểu mẫu đăng nhập chưa kết nối backend.' },
  register: { title: 'Đăng ký', body: 'Biểu mẫu đăng ký chưa kết nối backend.' },
}

export function StaticPage({ pageKey }: { pageKey?: string }) {
  const params = useParams()
  const key = pageKey ?? params.page ?? ''
  const page = PAGES[key]
  usePageMeta({
    title: `${page?.title ?? 'Không tìm thấy'} - VIET69`,
    description: page?.body ?? 'Trang không tồn tại.',
  })
  if (!page) return <NotFoundPage />
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, color: '#e0e0e0' }}>
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: page.title }]} />
      <h1>{page.title}</h1>
      <p>{page.body}</p>
    </div>
  )
}

export function NotFoundPage() {
  usePageMeta({ title: '404 - VIET69', description: 'Không tìm thấy trang.' })
  return (
    <div style={{ textAlign: 'center', padding: 80, color: '#e0e0e0' }}>
      <h1>404</h1>
      <p>Trang bạn tìm không tồn tại.</p>
      <Link to="/" style={{ color: '#e94560' }}>Về trang chủ</Link>
    </div>
  )
}