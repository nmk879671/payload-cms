import React from 'react'
import { HeroBlock } from './Hero'
import { ContentBlock } from './Content'
import { MediaBlockView } from './MediaBlock'
import { CTABlock } from './CTA'
import { FAQBlock } from './FAQ'

const map: Record<string, React.FC<{ block: any }>> = {
  hero: HeroBlock,
  content: ContentBlock,
  media: MediaBlockView,
  cta: CTABlock,
  faq: FAQBlock,
}

export const BlockRenderer = ({ blocks }: { blocks: any[] }) => {
  if (!Array.isArray(blocks)) return null
  return (
    <>
      {blocks.map((b, i) => {
        const Component = map[b.blockType]
        if (!Component) return null
        return <Component key={b.id || i} block={b} />
      })}
    </>
  )
}
