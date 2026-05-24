import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'

import { RichText } from '../../../../blocks-frontend/RichText'
import { buildMetadata } from '../../../../seo/buildMetadata'
import { buildJsonLd } from '../../../../seo/buildJsonLd'
import { JsonLdScript } from '../../../../seo/JsonLdScript'
import '../../../../blocks-frontend/blocks.scss'

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

const fetchPost = async (
  slug: string,
  isPreview: boolean,
  locale: SupportedLocale,
) => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'posts' as any,
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
  const post: any = await fetchPost(slug, false, locale)
  if (!post) return { title: 'Not found' }
  return buildMetadata({
    title: post.title,
    description: post.seo?.metaDescription || post.excerpt,
    path: `/posts/${post.slug}`,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    seo: post.seo,
  })
}

export default async function PostBySlug({ params, searchParams }: Args) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = sp?.preview === '1'
  const locale = normalizeLocale(sp?.locale)
  const post: any = await fetchPost(slug, isPreview, locale)
  if (!post) return notFound()

  const jsonLd = buildJsonLd({
    title: post.title,
    description: post.seo?.metaDescription || post.excerpt,
    path: `/posts/${post.slug}`,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author:
      typeof post.author === 'object'
        ? { name: post.author.name, email: post.author.email }
        : null,
    seo: { ...(post.seo || {}), schemaType: post.seo?.schemaType || 'BlogPosting' },
  })

  const cover =
    typeof post.coverImage === 'object' && post.coverImage?.url
      ? post.coverImage.url
      : null

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
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 12px',
            }}
          >
            {post.title}
          </h1>
          {post.excerpt && (
            <p style={{ color: '#6b7280', fontSize: 18, margin: 0 }}>
              {post.excerpt}
            </p>
          )}
        </header>
        {cover && (
          <img
            src={cover}
            alt={post.title}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 12,
              marginBottom: 32,
            }}
          />
        )}
        <div className="post-body">
          <RichText data={post.content} />
        </div>
      </article>
    </main>
  )
}
