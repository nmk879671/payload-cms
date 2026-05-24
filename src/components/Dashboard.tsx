import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import './Dashboard.scss'

type Stat = {
  label: string
  value: number
  hint: string
  href: string
  accent: 'indigo' | 'emerald' | 'violet' | 'amber'
}

const formatRelative = (date?: string | Date | null) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

const Sparkline = ({ data, accent }: { data: number[]; accent: string }) => {
  const w = 120
  const h = 36
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = w / (data.length - 1 || 1)
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ')
  const area = `0,${h} ${points} ${w},${h}`
  return (
    <svg
      className={`sparkline sparkline--${accent}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon className="sparkline__area" points={area} />
      <polyline className="sparkline__line" points={points} />
    </svg>
  )
}

const Dashboard: React.FC = async () => {
  const payload = await getPayload({ config })

  const [users, posts, pages, media] = await Promise.all([
    payload.count({ collection: 'users' }),
    payload.count({ collection: 'posts' as any }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'pages' as any }).catch(() => ({ totalDocs: 0 })),
    payload.count({ collection: 'media' }).catch(() => ({ totalDocs: 0 })),
  ])

  const recent = await payload
    .find({
      collection: 'posts' as any,
      limit: 6,
      sort: '-updatedAt',
      depth: 1,
    })
    .catch(() => ({ docs: [] as any[] }))

  const stats: Stat[] = [
    {
      label: 'Active Users',
      value: users.totalDocs,
      hint: 'Total registered',
      href: '/admin/collections/users',
      accent: 'indigo',
    },
    {
      label: 'Post Count',
      value: posts.totalDocs,
      hint: 'Drafts + published',
      href: '/admin/collections/posts',
      accent: 'emerald',
    },
    {
      label: 'Pages',
      value: pages.totalDocs,
      hint: 'Static pages',
      href: '/admin/collections/pages',
      accent: 'violet',
    },
    {
      label: 'Total Media',
      value: media.totalDocs,
      hint: 'Images & files',
      href: '/admin/collections/media',
      accent: 'amber',
    },
  ]

  // synthetic sparkline data per stat — small visual flourish
  const spark = (n: number) =>
    Array.from({ length: 12 }, (_, i) =>
      Math.max(0, Math.round(n * (0.4 + 0.6 * Math.sin(i / 2 + n)) + i)),
    )

  return (
    <div className="custom-dashboard">
      <header className="custom-dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p className="custom-dashboard__subtitle">
            Welcome back. Here&apos;s an overview of your content.
          </p>
        </div>
      </header>

      <section className="custom-dashboard__stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`stat-card stat-card--${s.accent}`}>
            <div className="stat-card__top">
              <span className="stat-card__label">{s.label}</span>
              <span className="stat-card__dot" />
            </div>
            <div className="stat-card__value">{s.value.toLocaleString()}</div>
            <div className="stat-card__hint">{s.hint}</div>
            <Sparkline data={spark(s.value)} accent={s.accent} />
          </Link>
        ))}
      </section>

      <section className="custom-dashboard__grid">
        <div className="panel panel--activity">
          <header className="panel__header">
            <h2>Recent Activity</h2>
            <Link href="/admin/collections/posts" className="panel__link">
              View all →
            </Link>
          </header>
          {recent.docs.length === 0 ? (
            <div className="panel__empty">No posts yet. Create your first post to see activity here.</div>
          ) : (
            <ul className="activity">
              {recent.docs.map((p: any) => (
                <li key={p.id} className="activity__item">
                  <div className="activity__avatar" aria-hidden>
                    {(p.author?.name || p.author?.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="activity__body">
                    <Link href={`/admin/collections/posts/${p.id}`} className="activity__title">
                      {p.title}
                    </Link>
                    <div className="activity__meta">
                      <span className={`pill pill--${
                        p.status === 'published' ? 'success'
                        : p.status === 'scheduled' ? 'info'
                        : p.status === 'in_review' ? 'warning'
                        : 'neutral'
                      }`}>
                        {(p.status || 'draft').replace('_', ' ')}
                      </span>
                      <span className="activity__sub">
                        {p.author?.name || p.author?.email || 'Unknown'} · {formatRelative(p.updatedAt)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel panel--quick">
          <header className="panel__header">
            <h2>Quick Actions</h2>
          </header>
          <div className="quick">
            <Link href="/admin/collections/posts/create" className="quick__item">
              <span className="quick__icon">＋</span>
              <div>
                <div className="quick__title">New Post</div>
                <div className="quick__sub">Create a blog post</div>
              </div>
            </Link>
            <Link href="/admin/collections/pages/create" className="quick__item">
              <span className="quick__icon">＋</span>
              <div>
                <div className="quick__title">New Page</div>
                <div className="quick__sub">Build with dynamic blocks</div>
              </div>
            </Link>
            <Link href="/admin/collections/media/create" className="quick__item">
              <span className="quick__icon">↑</span>
              <div>
                <div className="quick__title">Upload Media</div>
                <div className="quick__sub">Images & files</div>
              </div>
            </Link>
            <Link href="/admin/collections/users/create" className="quick__item">
              <span className="quick__icon">＋</span>
              <div>
                <div className="quick__title">Invite User</div>
                <div className="quick__sub">Add a team member</div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
