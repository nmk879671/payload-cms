# Port Admin Theme to This Project

把另一個 Payload 專案的 admin 客製化(主題、Sidebar、Topbar、Dashboard)搬到目前這個專案。原專案路徑:`/Users/winnie/Winnie/payload-cms`。

兩邊都是 Payload 3.x。**Collections 命名完全不同**,所以 `Dashboard.tsx` 跟 `iconMap.tsx` 需要根據本專案的 collections 重寫,其他檔案直接複製即可。

---

## Step 0 — 先做的事

1. 確認本專案是 Payload 3.x、Next.js App Router、有 `src/app/(payload)/` 目錄。
2. 讀 `src/payload.config.ts`,列出本專案所有 collection 的 slug、所有 global 的 slug、以及任何 `admin.group` 值 —— 後面 Step 4 跟 Step 5 會用到。
3. 確認 `src/app/(payload)/layout.tsx` 跟 `src/app/(payload)/admin/importMap.js` 存在(Payload 預設會生)。

---

## Step 1 — 複製檔案(從來源專案原樣搬過來,不要改)

從 `/Users/winnie/Winnie/payload-cms/` 複製到本專案的對應路徑:

| 來源 | 目的地 |
|---|---|
| `src/app/(payload)/custom.scss` | `src/app/(payload)/custom.scss` |
| `src/components/admin/Nav/index.tsx` | `src/components/admin/Nav/index.tsx` |
| `src/components/admin/Nav/NavClient.tsx` | `src/components/admin/Nav/NavClient.tsx` |
| `src/components/admin/Nav/Nav.scss` | `src/components/admin/Nav/Nav.scss` |
| `src/components/admin/Topbar/index.tsx` | `src/components/admin/Topbar/index.tsx` |
| `src/components/admin/Topbar/TopbarClient.tsx` | `src/components/admin/Topbar/TopbarClient.tsx` |
| `src/components/admin/Topbar/Topbar.scss` | `src/components/admin/Topbar/Topbar.scss` |
| `src/components/Dashboard.scss` | `src/components/Dashboard.scss` |

⚠️ **不要複製** `src/app/(payload)/admin/importMap.js` —— 這檔案會在 Step 6 重新生成。

---

## Step 2 — `iconMap.tsx`(要根據本專案 collections 重寫)

來源檔:`src/components/admin/Nav/iconMap.tsx`,結構長這樣:

```tsx
import { Box, FileText, Image, Tag, Users, Shield, /* ... */ type LucideIcon } from 'lucide-react'

const ENTITY_ICONS: Record<string, LucideIcon> = {
  posts: FileText,
  pages: Layers,
  // ...slug → icon
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  Content: FileText,
  // ...group label → icon
}

export const iconForSlug = (slug) => ENTITY_ICONS[slug] ?? Database
export const iconForGroup = (label) => GROUP_ICONS[label] ?? GROUP_ICONS.Default
export const dashboardIcon = LayoutDashboard
```

請建立 `src/components/admin/Nav/iconMap.tsx`,根據 Step 0 列出來的 collection slug 跟 group 名稱,挑合適的 [lucide-react](https://lucide.dev/icons) icon 對應上。沒對到的會 fallback 到 `Database` icon,所以漏掉也不會壞。

---

## Step 3 — `Dashboard.tsx`(要根據本專案 collections 重寫)

來源 `src/components/Dashboard.tsx` 寫死了 `payload.count({ collection: 'posts' })`、`'pages'`、`'media'`、`'users'`,還有 "Recent Posts" 列表跟 "Quick Actions" 連到 `/admin/collections/posts/create` 等。

請在 `src/components/Dashboard.tsx` 重寫,規則:
- 保留來源檔的整體結構(`custom-dashboard` / `stat-card` / `panel` / `quick` / `activity` 這些 className,**Dashboard.scss 都靠這些 class**,不要改)。
- 挑 **3-4 個本專案的主要 collection** 做 stat card,用 `payload.count({ collection: <slug> })`。
- "Recent Activity" 列表:挑一個有 `updatedAt` 跟最好有 `title`/`status`/`author` 欄位的 collection。如果該 collection 沒有 status 欄位,把 status pill 拿掉。如果沒有 author,把 avatar 跟 author 名顯示換成集合名或留白。
- "Quick Actions" 改成連到本專案 3-4 個常用 collection 的 `/admin/collections/<slug>/create`。
- 保留 `Sparkline` component 跟 `formatRelative` helper,不用改。

如果不確定本專案的 collection 欄位,讀對應的 `src/collections/*.ts` 確認。

---

## Step 4 — 改 `payload.config.ts`

找到 `buildConfig({ ... })` 裡的 `admin` 區塊,改成:

```ts
admin: {
  user: Users.slug,           // 保留原本的
  theme: 'dark',              // 加這行
  meta: {
    titleSuffix: ' — <你的專案名> CMS',   // 可改
  },
  components: {
    Nav: '/components/admin/Nav#default',
    header: ['/components/admin/Topbar#default'],
    views: {
      dashboard: {
        Component: '/components/Dashboard#default',
      },
    },
  },
  importMap: {
    baseDir: path.resolve(dirname),   // 確認本專案已 import path & dirname
  },
},
```

如果原本已有 `admin.components`,把上面三個 key 合併進去,不要整段覆蓋。

---

## Step 5 —(可選)Nav 兩層 group

來源 Nav 支援「Group → Subgroup → Item」兩層階層。要用的話在 collection config 加:

```ts
admin: {
  group: 'Content',
  custom: { subGroup: 'Editorial', subGroupOrder: 1 },
}
```

沒加 `custom.subGroup` 的 collection 會直接掛在 group 下,**完全不影響功能**,可以之後再慢慢加。Step 0 列出來的 group 名稱記得在 Step 2 的 `GROUP_ICONS` 配上 icon。

---

## Step 6 — 安裝相依套件

```bash
pnpm add lucide-react@^1.16.0 framer-motion@^12.40.0
```

(本專案若用 npm / yarn 改成對應指令。)

---

## Step 7 — 確認 `layout.tsx` 有 import scss

打開 `src/app/(payload)/layout.tsx`,確認有這行(Payload 預設生成的檔案就會有,如果沒有就加):

```ts
import './custom.scss'
```

---

## Step 8 — 重新生成 importMap

```bash
pnpm payload generate:importmap
```

這會掃描 `payload.config.ts` 裡的 component 路徑,重新寫 `src/app/(payload)/admin/importMap.js`。**一定要跑**,不然 Payload 找不到 `/components/admin/Nav` 等路徑。

---

## Step 9 — 啟動驗證

```bash
pnpm dev
```

打開 `http://localhost:3000/admin`,檢查:

- [ ] 左側是新的深色 sidebar(有 ⌘K 搜尋、⌘B 折疊、Workspace 標題)
- [ ] 頂部是 Topbar(有 theme 切換、用戶 menu)
- [ ] Dashboard 頁面顯示 stat card 跟 recent activity,數字不是 0(假設有資料)
- [ ] 點任一 collection 進列表,table 是深色卡片風格、有 sticky 工具列
- [ ] 進編輯頁,右側 sidebar 浮動、頂部有 floating save bar
- [ ] Lexical 編輯器是 Notion 風格(寬鬆 padding、深色 code block)

---

## 客製化提示(做完後想調的話)

- **主色**:`custom.scss` 最上面 `:root` 裡的 `--mc-brand-*` token(目前是 `#5B8CFF` 電光藍)。改完整套按鈕、active state、focus ring 都會跟著變。
- **Sidebar 寬度**:`--mc-sidebar-w: 280px` / `--mc-sidebar-w-collapsed: 72px` 也在 `:root`。
- **Brand 名字**:`NavClient.tsx` 第 201-202 行 `Winnie CMS` / `Workspace`,改成你的專案名。
- **Light theme**:目前主要是 dark first,light theme token 只覆蓋了一部分。要完整支援淺色需要補 `[data-theme='light']` 區塊的剩餘 token。

---

## 不要做的事

- ❌ 不要複製來源專案的 `importMap.js`(每個專案的 collections 不同,會壞)
- ❌ 不要複製來源專案的 `Roles.ts` / `Categories.ts` 等 collection 檔(這是內容相關的,跟 admin 客製化無關)
- ❌ 不要動 `Dashboard.scss` 的 className(會跟 `Dashboard.tsx` 對不上)
- ❌ 不要把 `theme: 'dark'` 拿掉前先補完 light theme token,否則淺色模式會炸
