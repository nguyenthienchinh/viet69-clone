import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface MetaProps {
  title: string
  description: string
}

export function usePageMeta({ title, description }: MetaProps) {
  const { pathname, search } = useLocation()
  useEffect(() => {
    document.title = title
    const origin = window.location.origin
    const url = origin + pathname + search
    const set = (selector: string, attr: string, value: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null
      if (!el) {
        el = create()
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }
    const meta = (name: string) => () => {
      const m = document.createElement('meta')
      m.setAttribute('name', name)
      return m
    }
    const og = (prop: string) => () => {
      const m = document.createElement('meta')
      m.setAttribute('property', prop)
      return m
    }
    set('meta[name="description"]', 'content', description, meta('description'))
    set('meta[property="og:title"]', 'content', title, og('og:title'))
    set('meta[property="og:description"]', 'content', description, og('og:description'))
    set('meta[property="og:url"]', 'content', url, og('og:url'))
    set('link[rel="canonical"]', 'href', url, () => {
      const l = document.createElement('link')
      l.setAttribute('rel', 'canonical')
      return l
    })
  }, [title, description, pathname, search])
}

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" style={{ color: '#a0a0a0', fontSize: 14, marginBottom: 16 }}>
      {items.map((c, i) => (
        <span key={i}>
          {c.to ? (
            <Link to={c.to} style={{ color: '#e0e0e0', textDecoration: 'none' }}>{c.label}</Link>
          ) : (
            <span>{c.label}</span>
          )}
          {i < items.length - 1 && <span style={{ margin: '0 8px' }}>›</span>}
        </span>
      ))}
    </nav>
  )
}