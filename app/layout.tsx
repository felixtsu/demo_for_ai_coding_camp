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
      <body className={`${inter.className} antialiased bg-white text-[#1E1E1E]`}>
        <Navigation />
        <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}

