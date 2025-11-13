# 文本改写工具

一个使用 Next.js 14、Supabase 和 DeepSeek API 构建的文本改写应用，可以去除文本中的 AI 味道，让文字更加自然人性化。

## 功能特性

- 🔐 用户认证（注册/登录）使用 Supabase Auth
- ✍️ 文本改写功能，使用 DeepSeek API 去除 AI 味道
- 🛡️ 路由保护，改写页面需要登录后才能访问
- 🎨 现代化的 UI 设计，使用 TailwindCSS

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Supabase** - 用户认证和数据库
- **DeepSeek API** - AI 文本改写
- **TailwindCSS** - 样式框架

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env.local` 并填入你的配置：

```bash
cp .env.example .env.local
```

需要配置的变量：

- `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 你的 Supabase Publishable Key
- `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
├── app/
│   ├── api/
│   │   └── rewrite/          # 改写 API 路由
│   ├── components/
│   │   └── navigation.tsx    # 导航组件
│   ├── login/                # 登录页面
│   ├── register/             # 注册页面
│   ├── rewrite/              # 改写页面（需要登录）
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 首页
├── lib/
│   ├── supabase/             # Supabase 客户端配置
│   └── deepseek.ts           # DeepSeek API 封装
└── middleware.ts             # 认证中间件
```

## 使用说明

1. **注册账号**: 访问首页，点击"注册"创建新账号
2. **登录**: 使用注册的邮箱和密码登录
3. **改写文本**: 登录后访问改写页面，输入需要改写的文本，点击"开始改写"
4. **复制结果**: 改写完成后可以复制结果文本

## 注意事项

- 确保 Supabase 项目已正确配置认证功能
- DeepSeek API Key 需要从 [deepseek.com](https://www.deepseek.com) 获取
- 改写功能需要网络连接以调用 DeepSeek API

