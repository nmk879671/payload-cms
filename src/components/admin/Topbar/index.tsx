import type { ServerProps } from 'payload'
import React from 'react'

import { TopbarClient } from './TopbarClient'
import './Topbar.scss'

/**
 * Sticky top bar — rendered via Payload's `admin.components.beforeNavLinks`
 * slot so we have access to ServerProps (user, payload, i18n).
 *
 * We deliberately render BEFORE the nav links and then position the bar
 * absolutely/fixed across the whole admin viewport via CSS. This is the
 * simplest non-invasive way to add a top bar without forking the admin
 * route layout.
 */
const Topbar: React.FC<ServerProps> = (props) => {
  const user = props.user as { name?: string; email?: string } | null
  const userLabel = user?.name || user?.email || 'Admin'

  return (
    <div className="mc-topbar-slot" data-mc-topbar>
      <TopbarClient userLabel={userLabel} />
    </div>
  )
}

export default Topbar
