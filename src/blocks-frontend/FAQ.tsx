import React from 'react'
import { RichText } from './RichText'

export const FAQBlock = ({ block }: { block: any }) => {
  return (
    <section className="b-faq">
      {block.heading && <h2 className="b-faq__heading">{block.heading}</h2>}
      <div className="b-faq__list">
        {(block.items || []).map((q: any, i: number) => (
          <details key={i} className="b-faq__item">
            <summary>{q.question}</summary>
            <div className="b-faq__answer">
              <RichText data={q.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
