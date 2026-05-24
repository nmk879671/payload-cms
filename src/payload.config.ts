import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { zh } from '@payloadcms/translations/languages/zh'
import { ja } from '@payloadcms/translations/languages/ja'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { Categories } from './collections/Categories'
import { Roles } from './collections/Roles'
import { seedRoles } from './seed/seedRoles'
import { publishScheduled } from './jobs/publishScheduled'

declare global {
  // eslint-disable-next-line no-var
  var __scheduledPublishInterval: NodeJS.Timeout | undefined
}

const SCHEDULED_TICK_MS = 30_000

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Winnie CMS',
    },
    components: {
      views: {
        dashboard: {
          Component: '/components/Dashboard#default',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { en, zh, ja },
    fallbackLanguage: 'en',
  },
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '简体中文', code: 'zh-CN' },
      { label: '繁體中文', code: 'zh-TW' },
      { label: '日本語', code: 'ja' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [Pages, Posts, Categories, Media, Users, Roles],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
  onInit: async (payload) => {
    await seedRoles(payload)

    // Auto-publish docs whose scheduledAt has passed.
    // Guard against double-registration during Next.js hot reload.
    if (globalThis.__scheduledPublishInterval) {
      clearInterval(globalThis.__scheduledPublishInterval)
    }
    globalThis.__scheduledPublishInterval = setInterval(() => {
      publishScheduled(payload, { log: false }).catch((err) => {
        payload.logger.error(`publishScheduled tick failed: ${err}`)
      })
    }, SCHEDULED_TICK_MS)
    payload.logger.info(
      `Scheduled publisher running every ${SCHEDULED_TICK_MS / 1000}s`,
    )
  },
})
