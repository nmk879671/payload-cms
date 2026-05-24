import React from 'react'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

export const RichText = ({ data }: { data: any }) => {
  if (!data) return null
  return <LexicalRichText data={data} />
}
