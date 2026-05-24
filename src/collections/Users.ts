import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isAdminOrSelf } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
    group: 'Admin',
  },
  auth: {
    depth: 1,
  },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture shown in the admin UI.',
      },
    },
    {
      name: 'role',
      type: 'relationship',
      relationTo: 'roles',
      required: true,
      hasMany: false,
      access: {
        update: isAdminField,
      },
      admin: {
        description: 'Only admins can change a user\'s role.',
      },
    },
  ],
}
