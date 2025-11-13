# 文字改寫工具

一個使用 Next.js 14、Supabase 和 DeepSeek API 構建的文字改寫應用，可以去除文字中的 AI 味道，讓文字更加自然人性化。

## 功能特性

- 🔐 用戶認證（註冊/登入）使用 Supabase Auth
- ✍️ 文字改寫功能，使用 DeepSeek API 去除 AI 味道
- 🛡️ 路由保護與每日配額限制，訂閱後方可使用
- 💳 付費方案管理，每個方案提供固定每日配額
- 🎨 現代化的 UI 設計，使用 TailwindCSS

## 技術棧

- **Next.js 14** - React 框架
- **TypeScript** - 類型安全
- **Supabase** - 用戶認證和資料庫
- **DeepSeek API** - AI 文字改寫
- **TailwindCSS** - 樣式框架

## 開始使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製 `.env.example` 檔案為 `.env.local` 並填入你的配置：

```bash
cp .env.example .env.local
```

需要配置的變數：

- `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 專案 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 你的 Supabase Publishable Key
- `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key

### 3. 執行開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看應用。

## 專案結構

```
├── app/
│   ├── api/
│   │   └── rewrite/          # 改寫 API 路由（含配額驗證）
│   ├── pricing/              # 方案頁面
│   ├── login/                # 登入頁面
│   ├── register/             # 註冊頁面
│   ├── rewrite/              # 改寫頁面（需要登入 + 訂閱）
│   ├── layout.tsx            # 根佈局
│   └── page.tsx              # 首頁
├── lib/
│   ├── rewrite/              # 改寫相關邏輯（配額）
│   └── supabase/             # Supabase 客戶端配置
├── supabase/
│   └── migrations/           # 資料表與 RPC 建立腳本
└── middleware.ts             # 認證中間件
```

## 使用說明

1. **註冊帳戶**: 存取首頁，點擊「註冊」建立新帳戶
2. **選擇方案**: 登入後到「方案」頁面，選擇適合的訂閱（需於 Supabase 新增訂閱紀錄）
3. **改寫文字**: 訂閱有效且每日配額尚有剩餘時，可以輸入文字並點擊「開始改寫」
4. **複製結果**: 改寫完成後可以複製結果文字

## 訂閱與每日配額

專案提供 `Starter`、`Professional`、`Team` 三種方案，每日配額分別為 5、20、60 次。使用者必須擁有狀態為 `active` 或 `trialing` 的訂閱才可呼叫改寫 API。系統會自動記錄每日使用次數，超額會阻擋請求。

請在 Supabase 專案中執行 `supabase/migrations/202511130001_subscription_usage.sql` 來建立所需資料表與 `consume_rewrite_credit` RPC 函式。完成後，為用戶新增對應的 `user_subscriptions` 記錄即可開通配額。

## 注意事項

- 確保 Supabase 專案已正確配置認證功能
- DeepSeek API Key 需要從 [deepseek.com](https://www.deepseek.com) 取得
- 改寫功能需要網路連線以呼叫 DeepSeek API

