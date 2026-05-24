import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media Blocks' },
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full bleed', value: 'full' },
      ],
    },
  ],
}
