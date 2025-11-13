# 文字改寫工具

一個使用 Next.js 14、Supabase 和 DeepSeek API 構建的文字改寫應用，可以去除文字中的 AI 味道，讓文字更加自然人性化。

## 功能特性

- 🔐 用戶認證（註冊/登入）使用 Supabase Auth
- ✍️ 文字改寫功能，使用 DeepSeek API 去除 AI 味道
- 🛡️ 路由保護，改寫頁面需要登入後才能存取
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
│   │   └── rewrite/          # 改寫 API 路由
│   ├── components/
│   │   └── navigation.tsx    # 導航組件
│   ├── login/                # 登入頁面
│   ├── register/             # 註冊頁面
│   ├── rewrite/              # 改寫頁面（需要登入）
│   ├── layout.tsx            # 根佈局
│   └── page.tsx              # 首頁
├── lib/
│   ├── supabase/             # Supabase 客戶端配置
│   └── deepseek.ts           # DeepSeek API 封裝
└── middleware.ts             # 認證中間件
```

## 使用說明

1. **註冊帳戶**: 存取首頁，點擊「註冊」建立新帳戶
2. **登入**: 使用註冊的電郵地址和密碼登入
3. **改寫文字**: 登入後存取改寫頁面，輸入需要改寫的文字，點擊「開始改寫」
4. **複製結果**: 改寫完成後可以複製結果文字

## 注意事項

- 確保 Supabase 專案已正確配置認證功能
- DeepSeek API Key 需要從 [deepseek.com](https://www.deepseek.com) 取得
- 改寫功能需要網路連線以呼叫 DeepSeek API

