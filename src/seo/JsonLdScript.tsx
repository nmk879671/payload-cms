import React from 'react'

export const JsonLdScript = ({
  data,
}: {
  data: Record<string, any> | null
}) => {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
