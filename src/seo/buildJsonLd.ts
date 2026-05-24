const siteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const absoluteUrl = (path: string): string => {
  if (!path) return siteUrl()
  if (path.startsWith('http')) return path
  return `${siteUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

const mediaUrl = (media: any): string | undefined => {
  if (!media || typeof media === 'string') return undefined
  return media.url ? absoluteUrl(media.url) : undefined
}

type Source = {
  title: string
  description?: string
  path: string
  publishedAt?: string | Date | null
  updatedAt?: string | Date | null
  author?: { name?: string; email?: string } | null
  seo?: any
  faqItems?: Array<{ question: string; answer?: any }>
}

export const buildJsonLd = (src: Source): Record<string, any> | null => {
  const seo = src.seo || {}
  const schemaType = seo.schemaType || 'WebPage'
  const url = seo.canonicalUrl || absoluteUrl(src.path)
  const image = mediaUrl(seo.ogImage)

  const base: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: seo.metaTitle || src.title,
    headline: seo.metaTitle || src.title,
    description: seo.metaDescription || src.description,
    url,
    ...(image ? { image } : {}),
  }

  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    if (src.publishedAt) base.datePublished = new Date(src.publishedAt).toISOString()
    if (src.updatedAt) base.dateModified = new Date(src.updatedAt).toISOString()
    if (src.author?.name || src.author?.email) {
      base.author = {
        '@type': 'Person',
        name: src.author.name || src.author.email,
      }
    }
  }

  if (schemaType === 'FAQPage' && src.faqItems?.length) {
    base.mainEntity = src.faqItems.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof q.answer === 'string' ? q.answer : '',
      },
    }))
  }

  return base
}
