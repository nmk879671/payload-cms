import type { Block } from 'payload'

export const Content: Block = {
  slug: 'content',
  labels: { singular: 'Content', plural: 'Content Blocks' },
  fields: [
    {
      name: 'columns',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'full',
          options: [
            { label: 'One Third', value: 'oneThird' },
            { label: 'Half', value: 'half' },
            { label: 'Two Thirds', value: 'twoThirds' },
            { label: 'Full', value: 'full' },
          ],
        },
        { name: 'richText', type: 'richText' },
      ],
    },
  ],
}
