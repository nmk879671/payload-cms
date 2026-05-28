import type { Access, CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  statusWorkflowFields,
  type Status,
} from '../hooks/statusWorkflow'

/* ===================================================================
   Status flow shapes
   Each flow is a transition table: { from → list of allowed `to` }
   =================================================================== */

export type FlowKey = 'simple' | 'scheduled' | 'review' | 'reviewScheduled'

const FLOW_TRANSITIONS: Record<FlowKey, Partial<Record<Status, Status[]>>> = {
  simple: {
    draft: ['published'],
    published: ['draft'],
  },
  scheduled: {
    draft: ['scheduled'],
    scheduled: ['draft', 'published'],
    published: ['draft'],
  },
  review: {
    draft: ['in_review'],
    in_review: ['draft', 'published'],
    published: ['draft'],
  },
  reviewScheduled: {
    draft: ['in_review'],
    in_review: ['draft', 'scheduled', 'published'],
    scheduled: ['draft', 'published'],
    published: ['draft'],
  },
}

/* ===================================================================
   Permission scope / role classes
   Role keys follow `<scope>_<class>` convention:
     ir_owner, ir_sec_owner, ir_reviewer
     pr_owner, pr_sec_owner, pr_reviewer
   `admin` is global and bypasses scope checks.
   =================================================================== */

export type ScopeKey = 'ir' | 'pr'
type RoleClass = 'owner' | 'reviewer' | 'admin'

const getRoleKey = (user: any): string | null => {
  const role = user?.role
  if (role && typeof role === 'object' && 'key' in role) {
    return role.key as string
  }
  return null
}

const roleClassOf = (
  roleKey: string | null,
  scope: ScopeKey,
): RoleClass | null => {
  if (roleKey === 'admin') return 'admin'
  if (!roleKey) return null
  if (roleKey === `${scope}_owner` || roleKey === `${scope}_sec_owner`) {
    return 'owner'
  }
  if (roleKey === `${scope}_reviewer`) return 'reviewer'
  return null
}

/**
 * For each "from" status, which role classes are allowed to transition out.
 *  - draft: owner moves forward
 *  - in_review: reviewer decides (approve / reject)
 *  - scheduled: reviewer cancels (auto-publish has no acting user)
 *  - published: anyone in scope can revert to draft (per user spec)
 * Admin can always transition.
 */
const STATUS_TRANSITION_PERMS: Record<Status, RoleClass[]> = {
  draft: ['owner', 'admin'],
  in_review: ['reviewer', 'admin'],
  scheduled: ['reviewer', 'admin'],
  published: ['owner', 'reviewer', 'admin'],
}

/* ===================================================================
   Access factory: scope-based "cross-scope is invisible"
   =================================================================== */

const scopeAccess = (scope: ScopeKey): Access => ({ req }) => {
  const roleKey = getRoleKey(req.user)
  return roleClassOf(roleKey, scope) !== null
}

/** Compose existing collection access with our scope check.
 *  Cross-scope users are denied regardless of what the original access said. */
const combineWithScope = (existing: any, scope: ScopeKey): Access => async (args) => {
  const inScope = await scopeAccess(scope)(args)
  if (!inScope) return false
  if (typeof existing === 'function') {
    return existing(args)
  }
  if (existing === undefined || existing === true) return true
  return existing
}

/* ===================================================================
   beforeChange hook factory
   Validates:
     - Cross-scope edits (deny)
     - in_review lock-out for owners
     - Requested transition is permitted by the flow
     - Requested transition is permitted by the user's role
     - scheduledAt is in the future when scheduling
   Then applies the transition (status, scheduledAt, publishedAt bookkeeping).
   =================================================================== */

const createWorkflowHook = ({
  flow,
  scope,
}: {
  flow: FlowKey
  scope: ScopeKey
}): CollectionBeforeChangeHook => async ({ data, originalDoc, req, operation }) => {
  const roleKey = getRoleKey(req.user)
  const cls = roleClassOf(roleKey, scope)

  // Out-of-scope users can't write at all. Read is already blocked by access.read.
  if (!cls) {
    throw new APIError("You don't have access to this content.", 403)
  }

  // Creates don't run transitions — just stamp defaults.
  if (operation === 'create') return data

  const currentStatus = (originalDoc?.status || 'draft') as Status

  // Lockout: while in_review, only reviewer/admin can save any change.
  if (currentStatus === 'in_review' && cls === 'owner') {
    throw new APIError(
      'This document is in review — only reviewers can edit it right now.',
      403,
    )
  }

  const target = (data?.changeToStatus as Status | undefined) || null
  if (!target) return data

  // Same-status no-op
  if (target === currentStatus) {
    data.changeToStatus = null
    return data
  }

  // Is this transition allowed by the flow shape?
  const allowed = FLOW_TRANSITIONS[flow][currentStatus] || []
  if (!allowed.includes(target)) {
    throw new APIError(
      `Cannot move from "${currentStatus}" to "${target}" in this workflow.`,
      400,
      { field: 'changeToStatus' },
    )
  }

  // Is this user's role allowed to transition out of currentStatus?
  if (!STATUS_TRANSITION_PERMS[currentStatus].includes(cls)) {
    throw new APIError(
      `Your role can't transition from "${currentStatus}".`,
      403,
      { field: 'changeToStatus' },
    )
  }

  // Scheduled requires a future date
  if (target === 'scheduled') {
    const at = data.scheduledAt ? new Date(data.scheduledAt as any) : null
    if (!at || isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      throw new APIError(
        'scheduledAt must be a future date when scheduling.',
        400,
        { field: 'scheduledAt' },
      )
    }
  }

  // Apply
  data.status = target
  data.changeToStatus = null
  if (target === 'published' && currentStatus === 'scheduled') {
    data.scheduledAt = null
  }
  if (target === 'draft') {
    data.scheduledAt = null
  }
  if (
    target === 'published' &&
    !data.publishedAt &&
    !originalDoc?.publishedAt
  ) {
    data.publishedAt = new Date().toISOString()
  }

  return data
}

/* ===================================================================
   Public helper
   =================================================================== */

export type WorkflowConfig = {
  flow: FlowKey
  scope: ScopeKey
}

/**
 * Decorate a collection with a status workflow + role-scoped access.
 *
 * Adds:
 *   1. status / changeToStatus / scheduledAt sidebar fields (if not present)
 *   2. scope-based access on read/create/update/delete (cross-scope hidden)
 *   3. beforeChange hook enforcing the flow + transition permissions
 *
 * Use in payload.config.ts:
 *   withWorkflow(Pages, { flow: 'reviewScheduled', scope: 'ir' })
 */
export const withWorkflow = (
  coll: CollectionConfig,
  config: WorkflowConfig,
): CollectionConfig => {
  const hasStatusFields = coll.fields?.some(
    (f) => 'name' in f && f.name === 'status',
  )

  return {
    ...coll,
    fields: hasStatusFields
      ? coll.fields
      : [...(coll.fields || []), ...statusWorkflowFields],
    access: {
      ...coll.access,
      read: combineWithScope(coll.access?.read, config.scope),
      create: combineWithScope(coll.access?.create, config.scope),
      update: combineWithScope(coll.access?.update, config.scope),
      delete: combineWithScope(coll.access?.delete, config.scope),
    },
    hooks: {
      ...coll.hooks,
      beforeChange: [
        ...(coll.hooks?.beforeChange || []),
        createWorkflowHook(config),
      ],
    },
  }
}
