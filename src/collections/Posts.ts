import type { CollectionConfig } from 'payload'
import {
  canRead,
  isAdminOrOwnAuthor,
  hasRole,
} from '../access/roles'
import { seoTab } from '../seo/fields'

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'publishedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data, locale }) => {
        const code = (locale as any)?.code || locale || 'en'
        return `${siteUrl()}/posts/${data?.slug || ''}?preview=1&locale=${code}`
      },
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    preview: (doc, { locale }) =>
      `${siteUrl()}/posts/${doc?.slug || ''}?preview=1&locale=${locale || 'en'}`,
  },
  access: {
    read: canRead,
    create: hasRole('admin', 'secure_editor', 'editor', 'author'),
    update: isAdminOrOwnAuthor,
    delete: isAdminOrOwnAuthor,
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
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar' },
      defaultValue: ({ user }) => user?.id,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'excerpt',
              type: 'textarea',
              maxLength: 280,
              localized: true,
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
          ],
        },
        seoTab,
      ],
    },
  ],
}
