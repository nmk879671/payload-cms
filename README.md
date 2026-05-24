# Winnie CMS

Payload CMS v3 專案，搭配自訂 dark mode admin 主題。

---

## 在 local 啟動

### 1. 確認 Node 版本

需要 **Node 24 以上**（package.json 鎖死的）。

```bash
node -v
# 應該要 >= v24.15.0
```

沒裝的話用 nvm：

```bash
nvm install 24
nvm use 24
```

### 2. 安裝套件

```bash
npm install
```

### 3. 設定環境變數

```bash
cp .env.example .env
```

打開 `.env`，填這兩個值：

```ini
DATABASE_URL=mongodb://127.0.0.1/winnie-cms
PAYLOAD_SECRET=隨便產一串夠長的字串
```

產 secret 的快速方式：

```bash
openssl rand -base64 32
```

### 4. 啟動 MongoDB

**有本機 MongoDB 就直接跳第 5 步。** 沒有的話用 Docker：

```bash
docker compose up -d mongo
```

### 5. 啟動 dev server

```bash
npm run dev
```

開 [http://localhost:3000/admin](http://localhost:3000/admin) — 第一次會引導你建立 admin user。

---

## 其他常用指令

```bash
npm run devsafe        # 清掉 .next 快取再啟動（hot reload 卡住時用）
npm run build          # production build
npm run start          # 跑 production server（需先 build）
npm run generate:types        # 改 collection 後重產型別
npm run generate:importmap    # 改 admin.components 後重產 import map
```
