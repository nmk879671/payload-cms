import React from 'react'

export const MediaBlockView = ({ block }: { block: any }) => {
  const m = block.media
  if (!m || typeof m !== 'object' || !m.url) return null
  const size = block.size || 'normal'
  return (
    <figure className={`b-media b-media--${size}`}>
      <img src={m.url} alt={m.alt || ''} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  )
}
