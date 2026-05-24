import type { Payload } from 'payload'

/* ---------- Lexical rich text helpers ---------- */
const rtText = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const rtParagraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  children: [rtText(text)],
})

const rtHeading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [rtText(text)],
})

const richText = (...nodes: any[]) => ({
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: nodes,
  },
})

/* ---------- Block builders ---------- */
const heroBlock = (eyebrow: string, heading: string, sub: string, ctas: any[] = []) => ({
  blockType: 'hero',
  eyebrow,
  heading,
  subheading: sub,
  ctas,
})

const contentBlock = (paragraphs: string[]) => ({
  blockType: 'content',
  columns: [
    {
      size: 'full',
      richText: richText(...paragraphs.map((p) => rtParagraph(p))),
    },
  ],
})

const ctaBlock = (heading: string, description: string, buttons: any[]) => ({
  blockType: 'cta',
  heading,
  description,
  buttons,
})

const faqBlock = (heading: string, items: Array<{ q: string; a: string }>) => ({
  blockType: 'faq',
  heading,
  items: items.map((it) => ({
    question: it.q,
    answer: richText(rtParagraph(it.a)),
  })),
})

/* ---------- Seed ---------- */
type SeedResult = {
  categories: number
  posts: number
  pages: number
  skipped: string[]
}

export const seedDemoData = async (payload: Payload): Promise<SeedResult> => {
  const result: SeedResult = { categories: 0, posts: 0, pages: 0, skipped: [] }

  // Need at least one user to be the author for Posts
  const users = await payload.find({ collection: 'users', limit: 1, depth: 0 })
  const authorId = users.docs[0]?.id
  if (!authorId) {
    throw new Error('No users found. Register an admin first.')
  }

  const findOrCreate = async <T extends Record<string, any>>(
    collection: string,
    where: any,
    data: T,
  ): Promise<{ id: string; created: boolean }> => {
    const existing = await payload.find({
      collection: collection as any,
      where,
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      return { id: existing.docs[0].id as string, created: false }
    }
    const doc = await payload.create({
      collection: collection as any,
      data: data as any,
    })
    return { id: doc.id as string, created: true }
  }

  /* Categories — 2-level */
  const techParent = await findOrCreate(
    'categories',
    { slug: { equals: 'tech' } },
    { title: 'Tech', slug: 'tech', description: 'Engineering & product.' },
  )
  if (techParent.created) result.categories++

  const lifestyleParent = await findOrCreate(
    'categories',
    { slug: { equals: 'lifestyle' } },
    { title: 'Lifestyle', slug: 'lifestyle', description: 'Travel, food, life.' },
  )
  if (lifestyleParent.created) result.categories++

  const webDev = await findOrCreate(
    'categories',
    { slug: { equals: 'web-development' } },
    {
      title: 'Web Development',
      slug: 'web-development',
      parent: techParent.id,
      description: 'Frontend, backend, full-stack.',
    },
  )
  if (webDev.created) result.categories++

  const ai = await findOrCreate(
    'categories',
    { slug: { equals: 'ai' } },
    {
      title: 'AI',
      slug: 'ai',
      parent: techParent.id,
      description: 'Machine learning & LLMs.',
    },
  )
  if (ai.created) result.categories++

  const travel = await findOrCreate(
    'categories',
    { slug: { equals: 'travel' } },
    {
      title: 'Travel',
      slug: 'travel',
      parent: lifestyleParent.id,
      description: 'Trip notes from the road.',
    },
  )
  if (travel.created) result.categories++

  /* Posts */
  const posts = [
    {
      slug: 'welcome-to-our-blog',
      title: 'Welcome to our blog',
      excerpt: 'A short note on what to expect here.',
      categories: [techParent.id],
      content: richText(
        rtHeading('Hello, world', 'h2'),
        rtParagraph(
          'This blog is where we share things we ship, things we learned, and things we wish someone had told us sooner. New posts roughly weekly.',
        ),
        rtParagraph(
          'Expect a mix of engineering deep-dives, product reflections, and the occasional travel note.',
        ),
      ),
    },
    {
      slug: 'building-with-payload-cms',
      title: 'Building with Payload CMS',
      excerpt: 'Why we picked Payload, and the tradeoffs.',
      categories: [webDev.id],
      content: richText(
        rtHeading('Why Payload?', 'h2'),
        rtParagraph(
          'We wanted a code-first CMS where the schema lives in TypeScript, not in a database UI. Payload nails that.',
        ),
        rtHeading('The tradeoffs', 'h2'),
        rtParagraph(
          'Less plugin ecosystem than WordPress; in return, you own the code. For our use case the tradeoff was clearly worth it.',
        ),
      ),
    },
    {
      slug: 'ai-tools-we-love',
      title: 'AI tools we use every day',
      excerpt: 'A working list of the AI tools that actually saved us time this quarter.',
      categories: [ai.id],
      content: richText(
        rtParagraph(
          'Cursor for code. Claude Code for refactors and debugging across multiple files. Whisper for transcripts. Perplexity when we want footnotes.',
        ),
        rtParagraph(
          'The pattern: pick tools that fit a specific job rather than chasing whichever model is trending on Twitter.',
        ),
      ),
    },
    {
      slug: 'tokyo-trip-notes',
      title: 'Tokyo trip notes',
      excerpt: 'Quick hits from a week in Tokyo.',
      categories: [travel.id],
      content: richText(
        rtParagraph(
          'Best ramen of the trip: a tiny counter in Shinjuku at 11pm. Best coffee: Onibus in Nakameguro.',
        ),
        rtParagraph(
          'Skip Shibuya Sky on weekends. Go on a Tuesday morning instead.',
        ),
      ),
    },
  ]

  for (const p of posts) {
    const r = await findOrCreate(
      'posts',
      { slug: { equals: p.slug } },
      {
        title: p.title,
        slug: p.slug,
        status: 'published',
        publishedAt: new Date().toISOString(),
        author: authorId,
        excerpt: p.excerpt,
        content: p.content,
        categories: p.categories,
        seo: {
          metaTitle: p.title,
          metaDescription: p.excerpt,
          schemaType: 'BlogPosting',
        },
      },
    )
    if (r.created) result.posts++
    else result.skipped.push(`posts/${p.slug}`)
  }

  /* Pages */
  const pages = [
    {
      slug: 'home',
      title: 'Home',
      layout: [
        heroBlock(
          'Modern CMS',
          'Build content sites without fighting your CMS.',
          'A code-first CMS with live preview, multilingual content, and a clean admin UI.',
          [
            { label: 'Get started', href: '/get-started', variant: 'primary' },
            { label: 'See features', href: '/about', variant: 'secondary' },
          ],
        ),
        contentBlock([
          'Pages are made of dynamic blocks: Hero, Content, Media, CTA, FAQ. Marketing can compose pages without touching code.',
          'Every text field is localizable. Add English, Simplified Chinese, Traditional Chinese, and Japanese versions side-by-side.',
        ]),
        ctaBlock(
          'Ready to ship?',
          'Spin up an admin in under five minutes.',
          [{ label: 'Start free', href: '/signup', variant: 'primary' }],
        ),
      ],
    },
    {
      slug: 'about',
      title: 'About',
      layout: [
        heroBlock(
          'About us',
          'We make tools developers actually want to use.',
          'Small team. Long-term mindset. Allergic to bloat.',
        ),
        contentBlock([
          'We started this because every CMS we tried either made developers wait on a UI to define content shapes, or made marketers wait on developers to ship copy. We wanted neither.',
          'The result: a CMS where the schema is code, the content is data, and the UX respects both audiences.',
        ]),
        faqBlock('Frequently asked', [
          { q: 'Who is this for?', a: 'Teams building marketing sites, blogs, or documentation that need real i18n and previews.' },
          { q: 'Is it open source?', a: 'The core CMS yes. Our cloud hosting is paid.' },
          { q: 'Can I self-host?', a: 'Yes — anywhere Node + MongoDB runs.' },
        ]),
      ],
    },
    {
      slug: 'pricing',
      title: 'Pricing',
      layout: [
        heroBlock(
          'Pricing',
          'Simple, fair, transparent.',
          'Free for personal projects. Pay only when you grow.',
        ),
        contentBlock([
          'Free: unlimited collections, unlimited content, single admin user.',
          'Team ($29/mo): up to 10 admin users, audit log, custom roles.',
          'Business (custom): SSO, audit retention, premium support, SLA.',
        ]),
        ctaBlock(
          'Need an SLA or SOC2?',
          'Talk to us about a Business plan.',
          [{ label: 'Contact sales', href: '/contact', variant: 'primary' }],
        ),
        faqBlock('Pricing FAQ', [
          { q: 'Do I need a credit card?', a: 'No — the free tier is genuinely free.' },
          { q: 'What counts as an admin user?', a: 'Anyone who logs into the admin panel. Public site visitors are unlimited.' },
        ]),
      ],
    },
  ]

  for (const pg of pages) {
    const r = await findOrCreate(
      'pages',
      { slug: { equals: pg.slug } },
      {
        title: pg.title,
        slug: pg.slug,
        status: 'published',
        layout: pg.layout,
        seo: {
          metaTitle: pg.title,
          schemaType: 'WebPage',
        },
      },
    )
    if (r.created) result.pages++
    else result.skipped.push(`pages/${pg.slug}`)
  }

  return result
}
