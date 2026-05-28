import type { CollectionConfig } from 'payload'
import { canManageContent, canRead } from '../access/roles'
import { Hero } from '../blocks/Hero'
import { Content } from '../blocks/Content'
import { MediaBlock } from '../blocks/MediaBlock'
import { CTA } from '../blocks/CTA'
import { FAQ } from '../blocks/FAQ'
import { seoTab } from '../seo/fields'

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data, locale }) => {
        const code = (locale as any)?.code || locale || 'en'
        return `${siteUrl()}/${data?.slug || ''}?preview=1&locale=${code}`
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    preview: (doc, { locale }) =>
      `${siteUrl()}/${doc?.slug || ''}?preview=1&locale=${locale || 'en'}`,
  },
  access: {
    read: canRead,
    create: canManageContent,
    update: canManageContent,
    delete: canManageContent,
  },
  versions: {
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              required: true,
              localized: true,
              blocks: [Hero, Content, MediaBlock, CTA, FAQ],
            },
          ],
        },
        seoTab,
      ],
    },
  ],
}
