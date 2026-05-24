import React from 'react'
import { RichText } from './RichText'

const sizeClass: Record<string, string> = {
  oneThird: 'col--third',
  half: 'col--half',
  twoThirds: 'col--two-thirds',
  full: 'col--full',
}

export const ContentBlock = ({ block }: { block: any }) => {
  return (
    <section className="b-content">
      <div className="b-content__row">
        {(block.columns || []).map((col: any, i: number) => (
          <div key={i} className={`b-content__col ${sizeClass[col.size] || 'col--full'}`}>
            <RichText data={col.richText} />
          </div>
        ))}
      </div>
    </section>
  )
}
