import type { CollectionConfig } from 'payload'
import { canManageContent } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: () => true,
    create: canManageContent,
    update: canManageContent,
    delete: canManageContent,
  },
  versions: {
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
  upload: true,
}
