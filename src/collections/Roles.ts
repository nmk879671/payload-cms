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

  // IR scope — Investor Relations workflow
  {
    key: 'ir_owner',
    name: 'IR Owner',
    description: 'IR content owner — drafts and revisions.',
  },
  {
    key: 'ir_sec_owner',
    name: 'IR Secondary Owner',
    description: 'IR backup owner — same edit rights as ir_owner.',
  },
  {
    key: 'ir_reviewer',
    name: 'IR Reviewer',
    description: 'IR approver — moves docs through review → published.',
  },

  // PR scope — Public Relations workflow
  {
    key: 'pr_owner',
    name: 'PR Owner',
    description: 'PR content owner — drafts and revisions.',
  },
  {
    key: 'pr_sec_owner',
    name: 'PR Secondary Owner',
    description: 'PR backup owner — same edit rights as pr_owner.',
  },
  {
    key: 'pr_reviewer',
    name: 'PR Reviewer',
    description: 'PR approver — moves docs through review → published.',
  },

  // Legacy roles (kept for backwards compatibility with older access rules)
  {
    key: 'secure_editor',
    name: 'Secure Editor',
    description: 'Manage all content + publish (legacy).',
  },
  {
    key: 'editor',
    name: 'Editor',
    description: 'Manage content (legacy).',
  },
  {
    key: 'author',
    name: 'Author',
    description: 'Create posts and edit own posts only (legacy).',
  },
  { key: 'viewer', name: 'Viewer', description: 'Read-only access (legacy).' },
] as const
