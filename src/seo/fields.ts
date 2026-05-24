import type { Field, TabsField } from 'payload'

/**
 * Modern SEO fields used by Pages and Posts.
 * Text fields are localized so each language ships its own meta.
 * Images / handles / flags stay shared across locales.
 */
export const seoTab: TabsField['tabs'][number] = {
  label: 'SEO',
  description: 'Search engine + social sharing metadata.',
  fields: [
    {
      type: 'collapsible',
      label: 'Basic',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 70,
          localized: true,
          admin: {
            description: 'Recommended 50–60 chars. Falls back to the title.',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 200,
          localized: true,
          admin: {
            description: 'Recommended 120–160 chars. Shown in Google snippet.',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          localized: true,
          admin: {
            description: 'Comma-separated. Not used by Google but harmless.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Open Graph (Facebook, LinkedIn, etc.)',
      fields: [
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: '1200×630 recommended.' },
        },
        {
          name: 'ogType',
          type: 'select',
          defaultValue: 'website',
          options: [
            { label: 'Website', value: 'website' },
            { label: 'Article', value: 'article' },
            { label: 'Product', value: 'product' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Twitter / X',
      fields: [
        {
          name: 'twitterCard',
          type: 'select',
          defaultValue: 'summary_large_image',
          options: [
            { label: 'Summary', value: 'summary' },
            { label: 'Summary Large Image', value: 'summary_large_image' },
          ],
        },
        {
          name: 'twitterImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Optional. Falls back to OG image.' },
        },
        {
          name: 'twitterHandle',
          type: 'text',
          admin: { description: 'e.g. @yourbrand' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Indexing & canonical',
      fields: [
        {
          name: 'canonicalUrl',
          type: 'text',
          admin: { description: 'Leave blank to auto-derive from slug.' },
        },
        {
          name: 'noindex',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Hide from search engines.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Structured data (JSON-LD)',
      fields: [
        {
          name: 'schemaType',
          type: 'select',
          defaultValue: 'WebPage',
          options: [
            { label: 'WebPage', value: 'WebPage' },
            { label: 'Article', value: 'Article' },
            { label: 'BlogPosting', value: 'BlogPosting' },
            { label: 'Product', value: 'Product' },
            { label: 'FAQPage', value: 'FAQPage' },
            { label: 'Organization', value: 'Organization' },
          ],
          admin: {
            description:
              'Tells Google what kind of content this is. Affects rich-results eligibility.',
          },
        },
      ],
    },
  ],
}

export const seoGroupField: Field = {
  name: 'seo',
  type: 'group',
  fields: seoTab.fields,
}
