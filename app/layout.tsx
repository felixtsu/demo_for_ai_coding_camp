import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from './components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '文字改寫工具',
  description: '使用 AI 去除文字中的 AI 味道',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="zh-HK">
      <body className={`${inter.className} antialiased text-slate-900 dark:text-slate-100`}>
        <Navigation />
        <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  )
}

