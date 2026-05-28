'use client'

import { Check, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Props = { collection: string; id: string }

const callTransition = async (
  collection: string,
  id: string,
  target: 'published' | 'draft',
): Promise<void> => {
  // Hit Payload's REST update endpoint. The browser already has the
  // admin auth cookie, and our workflow hook will validate role/flow
  // server-side — so unauthorized clicks bounce with a clear error.
  const res = await fetch(`/api/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ changeToStatus: target }),
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data?.errors?.[0]?.message || data?.message || message
    } catch {
      /* swallow JSON parse errors */
    }
    throw new Error(message)
  }
}

const useTransition = (target: 'published' | 'draft') => {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (collection: string, id: string) => {
    setBusy(true)
    setError(null)
    try {
      await callTransition(collection, id, target)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, run }
}

export const ApproveButton: React.FC<Props> = ({ collection, id }) => {
  const { busy, error, run } = useTransition('published')
  return (
    <>
      <button
        type="button"
        className="review-board__action review-board__action--approve"
        onClick={() => run(collection, id)}
        disabled={busy}
        title="Approve and publish"
      >
        {busy ? (
          <Loader2 size={14} className="review-board__action-spinner" />
        ) : (
          <Check size={14} strokeWidth={2.5} />
        )}
        Approve
      </button>
      {error && <div className="review-board__action-error">{error}</div>}
    </>
  )
}

export const RejectButton: React.FC<Props> = ({ collection, id }) => {
  const { busy, error, run } = useTransition('draft')
  return (
    <>
      <button
        type="button"
        className="review-board__action review-board__action--reject"
        onClick={() => run(collection, id)}
        disabled={busy}
        title="Reject and send back to draft"
      >
        {busy ? (
          <Loader2 size={14} className="review-board__action-spinner" />
        ) : (
          <X size={14} strokeWidth={2.5} />
        )}
        Reject
      </button>
      {error && <div className="review-board__action-error">{error}</div>}
    </>
  )
}
