import React from 'react'

export const CTABlock = ({ block }: { block: any }) => {
  return (
    <section className="b-cta">
      <div className="b-cta__inner">
        <h2 className="b-cta__heading">{block.heading}</h2>
        {block.description && (
          <p className="b-cta__desc">{block.description}</p>
        )}
        {Array.isArray(block.buttons) && (
          <div className="b-cta__buttons">
            {block.buttons.map((b: any, i: number) => (
              <a
                key={i}
                href={b.href}
                className={`btn btn--${b.variant || 'primary'}`}
              >
                {b.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
