import type { ServerProps } from 'payload'
import {
  EntityType,
  groupNavItems,
  type EntityToGroup,
} from '@payloadcms/ui/shared'
import React from 'react'

import {
  NavClient,
  type NavEntitySerializable,
  type NavGroupSerializable,
  type NavSubgroupSerializable,
} from './NavClient'
import './Nav.scss'

/**
 * Custom Nav — replaces Payload's DefaultNav.
 *
 * Two-level grouping convention:
 *   admin: {
 *     group: 'DOTCOM',
 *     custom: { subGroup: 'Financial', subGroupOrder: 1 },
 *   }
 *
 *  - `group`     → first-level header (existing Payload field)
 *  - `subGroup`  → optional second-level header inside the group
 *  - Entities without a subGroup render directly under the group header.
 *  - Permission filtering is handled by Payload via `visibleEntities`.
 */
const Nav: React.FC<ServerProps> = (props) => {
  const { i18n, payload, permissions, visibleEntities, user } = props

  if (!payload?.config) return null

  const { collections, globals } = payload.config

  // Build slug → original config maps so we can read admin.custom.* later.
  const collectionBySlug = new Map<string, (typeof collections)[number]>()
  collections.forEach((c) => collectionBySlug.set(c.slug, c))
  const globalBySlug = new Map<string, (typeof globals)[number]>()
  globals.forEach((g) => globalBySlug.set(g.slug, g))

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

  const labelOf = (entity: any): string => {
    const raw = entity.label
    if (typeof raw === 'string') return raw
    return (
      (raw as Record<string, string>)?.[i18n!.language] ||
      (raw as Record<string, string>)?.en ||
      entity.slug
    )
  }

  const safeGroups: NavGroupSerializable[] = groups.map((group) => {
    const direct: NavEntitySerializable[] = []
    const subBuckets = new Map<
      string,
      { entities: NavEntitySerializable[]; order: number }
    >()

    group.entities.forEach((entity) => {
      const type =
        entity.type === EntityType.collection ? 'collection' : 'global'
      const cfg =
        type === 'collection'
          ? collectionBySlug.get(entity.slug)
          : globalBySlug.get(entity.slug)

      const custom = (cfg?.admin?.custom || {}) as {
        subGroup?: string
        subGroupOrder?: number
      }

      const safe: NavEntitySerializable = {
        slug: entity.slug,
        type,
        label: labelOf(entity),
      }

      if (custom.subGroup) {
        const bucket = subBuckets.get(custom.subGroup) || {
          entities: [],
          order: Number.POSITIVE_INFINITY,
        }
        bucket.entities.push(safe)
        if (typeof custom.subGroupOrder === 'number') {
          bucket.order = Math.min(bucket.order, custom.subGroupOrder)
        }
        subBuckets.set(custom.subGroup, bucket)
      } else {
        direct.push(safe)
      }
    })

    const subgroups: NavSubgroupSerializable[] = Array.from(subBuckets.entries())
      .map(([label, bucket]) => ({
        label,
        entities: bucket.entities,
        order: bucket.order,
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.label.localeCompare(b.label)
      })
      .map(({ label, entities }) => ({ label, entities }))

    return {
      label: group.label,
      entities: direct,
      subgroups,
    }
  })

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
