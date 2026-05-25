import type { CollectionConfig } from 'payload'
import { isAdmin, canRead } from '../access/roles'

export const Roles: CollectionConfig = {
  slug: 'roles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'description'],
    group: 'Admin',
    custom: {
      subGroup: 'Access',
      subGroupOrder: 1,
    },
  },
  access: {
    read: canRead,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stable identifier used in code (e.g. admin, editor).',
      },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'users',
      type: 'join',
      collection: 'users',
      on: 'role',
      admin: {
        defaultColumns: ['avatar', 'email', 'name'],
        description: 'Users assigned to this role.',
      },
    },
  ],
}

export const DEFAULT_ROLES = [
  { key: 'admin', name: 'Admin', description: 'Full access to everything.' },
  {
    key: 'secure_editor',
    name: 'Secure Editor',
    description: 'Manage all content + publish.',
  },
  {
    key: 'editor',
    name: 'Editor',
    description: 'Manage content (Posts/Pages/Categories/Media).',
  },
  {
    key: 'author',
    name: 'Author',
    description: 'Create posts and edit own posts only.',
  },
  { key: 'viewer', name: 'Viewer', description: 'Read-only access.' },
] as const
