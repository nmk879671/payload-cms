import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'

import { BlockRenderer } from '../../../blocks-frontend/BlockRenderer'
import { buildMetadata } from '../../../seo/buildMetadata'
import { buildJsonLd } from '../../../seo/buildJsonLd'
import { JsonLdScript } from '../../../seo/JsonLdScript'
import '../../../blocks-frontend/blocks.scss'

type Args = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string; locale?: string }>
}

const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
const normalizeLocale = (l?: string): SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(l || '')
    ? (l as SupportedLocale)
    : 'en'

const fetchPage = async (
  slug: string,
  isPreview: boolean,
  locale: SupportedLocale,
) => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'pages' as any,
    locale,
    fallbackLocale: 'en',
    where: {
      and: [
        { slug: { equals: slug } },
        ...(isPreview ? [] : [{ status: { equals: 'published' } }]),
      ],
    },
    depth: 2,
    limit: 1,
  })
  return res.docs[0] || null
}

export async function generateMetadata({
  params,
  searchParams,
}: Args): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const locale = normalizeLocale(sp?.locale)
  const page: any = await fetchPage(slug, false, locale)
  if (!page) return { title: 'Not found' }
  return buildMetadata({
    title: page.title,
    description: page.seo?.metaDescription,
    path: `/${page.slug}`,
    updatedAt: page.updatedAt,
    seo: page.seo,
  })
}

export default async function PageBySlug({ params, searchParams }: Args) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = sp?.preview === '1'
  const locale = normalizeLocale(sp?.locale)
  const page: any = await fetchPage(slug, isPreview, locale)
  if (!page) return notFound()

  const faqItems = (page.layout || [])
    .filter((b: any) => b.blockType === 'faq')
    .flatMap((b: any) => b.items || [])
  const jsonLd = buildJsonLd({
    title: page.title,
    description: page.seo?.metaDescription,
    path: `/${page.slug}`,
    updatedAt: page.updatedAt,
    seo: page.seo,
    faqItems,
  })

  return (
    <main>
      <JsonLdScript data={jsonLd} />
      {isPreview && (
        <div
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            padding: '8px 16px',
            fontSize: 13,
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          Draft preview
        </div>
      )}
      <BlockRenderer blocks={page.layout || []} />
    </main>
  )
}
