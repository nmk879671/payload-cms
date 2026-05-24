import type { ServerProps } from 'payload'
import {
  EntityType,
  groupNavItems,
  type EntityToGroup,
} from '@payloadcms/ui/shared'
import React from 'react'

import { NavClient, type NavGroupSerializable } from './NavClient'
import './Nav.scss'

/**
 * Custom Nav — replaces Payload's DefaultNav.
 *
 * Strategy:
 *  - Server: read payload config + permissions, run Payload's own grouping logic
 *  - Send a JSON-safe shape down to the client
 *  - Client: renders the premium sidebar (collapse, icons, animations, active state)
 */
const Nav: React.FC<ServerProps> = (props) => {
  const { i18n, payload, permissions, visibleEntities, user } = props

  if (!payload?.config) return null

  const { collections, globals } = payload.config

  const entitiesToGroup: EntityToGroup[] = [
    ...collections
      .filter(({ slug }) => visibleEntities?.collections?.includes(slug))
      .map(
        (collection): EntityToGroup => ({
          type: EntityType.collection,
          entity: collection,
        }),
      ),
    ...globals
      .filter(({ slug }) => visibleEntities?.globals?.includes(slug))
      .map(
        (global): EntityToGroup => ({
          type: EntityType.global,
          entity: global,
        }),
      ),
  ]

  const groups = groupNavItems(entitiesToGroup, permissions!, i18n!)

  // Strip non-serializable bits before handing off to the client component.
  const safeGroups: NavGroupSerializable[] = groups.map((group) => ({
    label: group.label,
    entities: group.entities.map((entity) => ({
      slug: entity.slug,
      type: entity.type === EntityType.collection ? 'collection' : 'global',
      label:
        typeof entity.label === 'string'
          ? entity.label
          : (entity.label as Record<string, string>)?.[i18n!.language] ||
            (entity.label as Record<string, string>)?.en ||
            entity.slug,
    })),
  }))

  const userLabel =
    (user as { name?: string; email?: string } | null)?.name ||
    (user as { email?: string } | null)?.email ||
    'Admin'

  return (
    <NavClient
      adminRoute="/admin"
      groups={safeGroups}
      userLabel={userLabel}
    />
  )
}

export default Nav
