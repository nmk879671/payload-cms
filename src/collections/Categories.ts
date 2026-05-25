import type { CollectionConfig, Where } from 'payload'
import { canManageContent, canRead } from '../access/roles'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', 'updatedAt'],
    group: 'Content',
    custom: {
      subGroup: 'Taxonomy',
      subGroupOrder: 1,
    },
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional. Only top-level categories can be parents (max 2 levels).',
      },
      filterOptions: ({ id }) => {
        const and: Where[] = [{ parent: { exists: false } }]
        if (id) and.push({ id: { not_equals: id } })
        return { and }
      },
      validate: async (
        value: any,
        { req, id }: { req: any; id?: string | number },
      ) => {
        if (!value) return true
        if (id && value === id) return 'A category cannot be its own parent.'
        try {
          const parent = await req.payload.findByID({
            collection: 'categories',
            id: value as string,
            depth: 0,
          })
          if (parent?.parent) {
            return 'Parent must be a top-level category (max 2 levels).'
          }
        } catch {
          return 'Selected parent does not exist.'
        }
        return true
      },
    },
    { name: 'description', type: 'textarea', localized: true },
  ],
}
