import type { Metadata } from 'next'

const siteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const absoluteUrl = (path: string): string => {
  if (!path) return siteUrl()
  if (path.startsWith('http')) return path
  return `${siteUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

const mediaUrl = (media: any): string | undefined => {
  if (!media) return undefined
  if (typeof media === 'string') return undefined
  if (media.url) return absoluteUrl(media.url)
  return undefined
}

type SeoSource = {
  title: string
  description?: string
  path: string
  publishedAt?: string | Date | null
  updatedAt?: string | Date | null
  author?: string
  seo?: any
}

export const buildMetadata = (src: SeoSource): Metadata => {
  const seo = src.seo || {}
  const title = seo.metaTitle || src.title
  const description = seo.metaDescription || src.description
  const url = seo.canonicalUrl || absoluteUrl(src.path)
  const ogImg = mediaUrl(seo.ogImage)
  const twitterImg = mediaUrl(seo.twitterImage) || ogImg
  const noindex = Boolean(seo.noindex)

  return {
    title,
    description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: (seo.ogType || 'website') as any,
      images: ogImg ? [{ url: ogImg }] : undefined,
    },
    twitter: {
      card: seo.twitterCard || 'summary_large_image',
      title,
      description,
      images: twitterImg ? [twitterImg] : undefined,
      site: seo.twitterHandle,
    },
  }
}
