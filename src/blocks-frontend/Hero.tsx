import React from 'react'

const mediaUrl = (m: any): string | undefined =>
  m && typeof m === 'object' && m.url ? m.url : undefined

export const HeroBlock = ({ block }: { block: any }) => {
  const bg = mediaUrl(block.backgroundImage)
  return (
    <section
      className="b-hero"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <div className="b-hero__inner">
        {block.eyebrow && <p className="b-hero__eyebrow">{block.eyebrow}</p>}
        <h1 className="b-hero__heading">{block.heading}</h1>
        {block.subheading && (
          <p className="b-hero__sub">{block.subheading}</p>
        )}
        {Array.isArray(block.ctas) && block.ctas.length > 0 && (
          <div className="b-hero__ctas">
            {block.ctas.map((c: any, i: number) => (
              <a
                key={i}
                href={c.href}
                className={`btn btn--${c.variant || 'primary'}`}
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
