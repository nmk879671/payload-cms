import type { CollectionBeforeChangeHook, Field } from 'payload'
import { APIError } from 'payload'
import { isAdminField } from '../access/roles'
import type { RoleKey } from '../access/roles'

export type Status = 'draft' | 'in_review' | 'scheduled' | 'published'

export const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
] as const

/**
 * Transition matrix.
 * For each (from → to) we list the role keys allowed to perform it.
 * Admin bypasses all checks.
 */
const TRANSITIONS: Record<Status, Partial<Record<Status, RoleKey[]>>> = {
  draft: {
    in_review: ['editor', 'author', 'secure_editor'],
    scheduled: ['secure_editor'],
    published: ['secure_editor'],
  },
  in_review: {
    draft: ['editor', 'author', 'secure_editor'],
    scheduled: ['secure_editor'],
    published: ['secure_editor'],
  },
  scheduled: {
    draft: ['secure_editor'],
    published: ['secure_editor'], // manual override before scheduledAt
  },
  published: {
    draft: ['secure_editor'],
  },
}

const isAllowed = (from: Status, to: Status, roleKey: RoleKey | null): boolean => {
  if (!roleKey) return false
  if (roleKey === 'admin') return true
  if (from === to) return true
  const allowed = TRANSITIONS[from]?.[to]
  return Boolean(allowed && allowed.includes(roleKey))
}

const roleKeyOf = (user: any): RoleKey | null => {
  const role = user?.role
  if (role && typeof role === 'object' && role.key) return role.key
  return null
}

/**
 * beforeChange hook: read `changeToStatus`, validate, apply, then clear.
 * If `changeToStatus` is empty, do nothing.
 */
export const statusWorkflowHook: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Skip on create — let the form's defaultValue handle initial status.
  // Also skip if no changeToStatus is being set.
  const target = data?.changeToStatus as Status | undefined | null
  if (!target) return data

  const current = (originalDoc?.status || data?.status || 'draft') as Status
  const role = roleKeyOf(req.user)

  if (!isAllowed(current, target, role)) {
    throw new APIError(
      `You don't have permission to move "${current}" → "${target}".`,
      403,
      { field: 'changeToStatus' },
    )
  }

  // Scheduled requires a future scheduledAt
  if (target === 'scheduled') {
    const at = data.scheduledAt ? new Date(data.scheduledAt as any) : null
    if (!at || isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      throw new APIError(
        'scheduledAt must be a future date when status is "scheduled".',
        400,
        { field: 'scheduledAt' },
      )
    }
  }

  // Apply transition
  data.status = target
  data.changeToStatus = null

  // If publishing manually from scheduled, clear scheduledAt
  if (target === 'published' && current === 'scheduled') {
    data.scheduledAt = null
  }
  // If returning to draft, clear scheduledAt
  if (target === 'draft') {
    data.scheduledAt = null
  }

  // If transitioning to published and publishedAt is empty, stamp it now
  if (target === 'published' && !data.publishedAt && !originalDoc?.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }

  return data
}

/**
 * Shared field set that all collections using the workflow should include.
 * Put these in your collection's `fields` (typically in the sidebar).
 */
export const statusWorkflowFields: Field[] = [
  {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue: 'draft',
    options: STATUS_OPTIONS as any,
    access: {
      // Only admins can set status directly; everyone else uses changeToStatus.
      update: isAdminField,
    },
    admin: {
      position: 'sidebar',
      description: 'Current status. Use "Change to status" below to request a transition.',
    },
  },
  {
    name: 'changeToStatus',
    type: 'select',
    options: STATUS_OPTIONS as any,
    admin: {
      position: 'sidebar',
      description:
        'Pick a target status and save to request a transition. Cleared after applying.',
    },
  },
  {
    name: 'scheduledAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
      description: 'Required when status is "scheduled".',
      condition: (data) =>
        data?.status === 'scheduled' || data?.changeToStatus === 'scheduled',
    },
  },
]
