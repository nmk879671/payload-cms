import type { CollectionConfig } from 'payload'

/**
 * Decorate a collection with version tracking:
 *   1. Adds `createdBy` + `updatedBy` relationship fields (sidebar, readOnly)
 *   2. Adds a beforeChange hook that stamps `req.user.id`:
 *      - `createdBy` only on first save (operation === 'create')
 *      - `updatedBy` on every save
 *   3. Wires the custom Versions list view (Saved At / Updated By / Status)
 *      on the edit page
 *
 * Skips collections that don't have `versions` enabled — no point tracking
 * who saved what if Payload isn't storing version history.
 *
 * Use in payload.config.ts:
 *   collections: [Pages, Posts, ...].map(withVersionTracking)
 */
export const withVersionTracking = (coll: CollectionConfig): CollectionConfig => {
  if (!coll.versions) return coll

  const hasField = (name: string) =>
    coll.fields?.some((f) => 'name' in f && f.name === name)

  const extraFields: CollectionConfig['fields'] = []
  if (!hasField('createdBy')) {
    extraFields.push({
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically when the document is first created.',
      },
    })
  }
  if (!hasField('updatedBy')) {
    extraFields.push({
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically when the document is saved.',
      },
    })
  }

  return {
    ...coll,
    admin: {
      ...coll.admin,
      components: {
        ...coll.admin?.components,
        views: {
          ...coll.admin?.components?.views,
          edit: {
            ...(coll.admin?.components?.views as any)?.edit,
            versions: {
              Component: '/components/admin/VersionsView#default',
            },
          } as any,
        },
      },
    },
    hooks: {
      ...coll.hooks,
      beforeChange: [
        ...(coll.hooks?.beforeChange || []),
        ({ data, req, operation }) => {
          if (!req.user?.id) return data
          if (operation === 'create') {
            data.createdBy = req.user.id
          }
          data.updatedBy = req.user.id
          return data
        },
      ],
    },
    fields: [...(coll.fields || []), ...extraFields],
  }
}
