# Review Board — 三個變體對照

給 PM 選擇的三個 Review Board 設計。三種設計 **共同** 遵守你的兩個要求：

- **沒有** Approve / Reject 按鈕
- 點卡片 / 列 / row → 進入該筆文件的 edit page，在該頁面切換 status（draft / in_review / published）
- 依 role 過濾：IR / PR reviewer 只看到自己 scope 的待審；admin 看全部
- 依 collection 分區（Pages / Posts 各一區）

差別只在**版面的呈現方式**。三種都可以並存體驗，選定之後其他兩個會刪掉。

---

## Nav 入口

登入為 reviewer 或 admin 後，左側 Nav 會出現三個 Review 入口：

- **Review · Cards** → `/admin/review-board`
- **Review · Table** → `/admin/review-board-table`
- **Review · Inbox** → `/admin/review-board-inbox`

---

## Pattern A · Cards

**路由**：`/admin/review-board`

**版面**：卡片格狀（每張 320px 起），依 collection 分區。

```
┌─────────────────── Pages [3] ───────────────────┐
│ ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│ │ Pricing222↗│  │ About    ↗ │  │ Contact  ↗ │  │
│ │ by Winnie  │  │ by Winnie  │  │ by Winnie  │  │
│ │ Jun 5 10:30│  │ Jun 4 09:11│  │ Jun 3 14:52│  │
│ └────────────┘  └────────────┘  └────────────┘  │
└──────────────────────────────────────────────────┘

┌─────────────────── Posts [2] ───────────────────┐
│ ┌────────────┐  ┌────────────┐                  │
│ │ AI tools ↗ │  │ Tokyo... ↗ │                  │
│ │ by Winnie  │  │ by Winnie  │                  │
│ │ Jun 5 08:12│  │ Jun 4 22:03│                  │
│ └────────────┘  └────────────┘                  │
└──────────────────────────────────────────────────┘
```

**適合**：每天待審量少（< 10 筆）、想要視覺感、每筆的份量看起來平均。

**優**：漂亮、每張卡片有呼吸空間、hover 有 elevation 動畫。

**缺**：資訊密度低、資料一多要滾很久、無法快速比較時間先後。

---

## Pattern B · Table

**路由**：`/admin/review-board-table`

**版面**：正式資料表，依 collection 分區、每區一張表。

```
┌ Pages ─ [3] ────────────────────────────────────────────────┐
│ TITLE            SUBMITTED BY   SUBMITTED                    │
│ ─────────────────────────────────────────────────────────── │
│ Pricing222       Winnie Admin   Jun 5, 10:30 AM         ›   │
│ About            Winnie Admin   Jun 4, 09:11 AM         ›   │
│ Contact          Winnie Admin   Jun 3, 02:52 PM         ›   │
└──────────────────────────────────────────────────────────────┘

┌ Posts ─ [2] ────────────────────────────────────────────────┐
│ AI tools we use  Winnie Admin   Jun 5, 08:12 AM         ›   │
│ Tokyo trip notes Winnie Admin   Jun 4, 10:03 PM         ›   │
└──────────────────────────────────────────────────────────────┘
```

**適合**：每天待審量中～高（10+ 筆）、reviewer 需要快速掃描、想要對齊的欄位。

**優**：資訊密度最高、水平比較快、螢幕滾動短、專業感。

**缺**：不夠「熱鬧」、每一列看起來一樣、缺少視覺層次。

---

## Pattern C · Inbox

**路由**：`/admin/review-board-inbox`

**版面**：類 Gmail 收件匣、依 collection 分區、每筆一列 rich meta。

```
┌ Pages [3] ──────────────────────────────────────────────────┐
│                                                              │
│ Pricing222                                     Jun 5, 10:30  │
│ Winnie Admin · 1h ago                                     →  │
│ ──────────────────────────────────────────────────────────── │
│ About                                          Jun 4, 09:11  │
│ Winnie Admin · 1d ago                                     →  │
│ ──────────────────────────────────────────────────────────── │
│ Contact                                        Jun 3, 14:52  │
│ Winnie Admin · 2d ago                                     →  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌ Posts [2] ──────────────────────────────────────────────────┐
│ AI tools we use every day                      Jun 5, 08:12  │
│ Winnie Admin · 3h ago                                     →  │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

每列包含：**標題**（大）＋ **submitter · 相對時間**（小）＋ **絕對時間**（右）＋ **hover 出現右箭頭**。

**適合**：待審量中等、reviewer 在意「是誰、多久沒動」而不是只有標題、想要熟悉的收件匣感。

**優**：每列有比 Table 更豐富的 meta、大而好點、hover 有動畫回饋。

**缺**：欄位不齊、不能快速看時間對齊、密度比 Table 低。

---

## 一句話對照

| 面向 | Cards | Table | Inbox |
|---|---|---|---|
| 資訊密度 | 低 | **高** | 中 |
| 視覺感 | **高** | 低 | 中 |
| 適合的量 | 少（<10） | **多（10+）** | 中（5-15） |
| 想要「submitter 一眼可見」 | 需要 hover 讀 | 對齊欄位 | **最明顯** |
| 螢幕大時觀感 | ✓ | ✓✓ | ✓ |
| 手機（<720px） | 卡片自動換行 | 水平捲軸 | 隱藏絕對時間 |

---

## 建議選擇邏輯

- **PM 判斷這裡通常一天 < 5 筆** → 選 **Cards**，最好看
- **未來會有大量待審（例如 news 網站、日更）** → 選 **Table**，最省時間
- **在意 reviewer 使用者體驗、想要熟悉的 workflow 感** → 選 **Inbox**，體驗最像 email

---

## 如何測試

登入時使用有 `admin` 或 `*_reviewer` 的帳號，然後：

1. 左側 Nav 三個 Review 入口都點過一次
2. 隨便點一筆進到 edit page
3. 在 edit page 右上或 sidebar 切換 status（draft / in_review / published）
4. 回到 Review Board 該筆就會消失（因為 status 不再是 in_review）

如果暫時沒有 in_review 資料，可用：

```bash
npx tsx scripts/seedInReview.ts
```

會把 3 筆 Pages + 3 筆 Posts 改成 in_review 用於測試。

---

## 選定之後

告訴我要留哪一個（Cards / Table / Inbox），我會把另外兩個對應的檔案 + Nav item + payload.config 註冊 + importMap 一次清掉，保持 codebase 乾淨。
