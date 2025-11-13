import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/rewrite')
  }

  return (
    <div className="flex flex-col gap-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-8 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/30 via-purple-300/20 to-sky-300/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-gradient-to-br from-rose-300/30 via-purple-200/20 to-blue-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1 text-sm font-medium text-indigo-600 ring-1 ring-indigo-500/30 dark:bg-indigo-400/10 dark:text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              写作质量更自然
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              去除 AI 味道，让每一段文字都像你亲手写的
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              轻松粘贴文本，借助智能语气调节与语义润色，在保持原意的基础上创作自然流畅的内容，适用于文章改写、品牌文案和学术场景。
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/40"
              >
                立即免费体验
                <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 px-6 py-3 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white hover:ring-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700"
              >
                已有账号？登录
              </Link>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/70">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-300">语气智能调节</dt>
                <dd className="mt-2 text-base font-semibold text-slate-900 dark:text-white">自动识别语境并生成自然表达</dd>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/70">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-300">实时生成</dt>
                <dd className="mt-2 text-base font-semibold text-slate-900 dark:text-white">平均 3 秒输出优化后的段落</dd>
              </div>
            </dl>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border border-indigo-100/70 bg-slate-900 text-left shadow-2xl shadow-indigo-500/20 transition dark:border-slate-700/60">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/70 via-sky-500/60 to-purple-500/60 mix-blend-screen" aria-hidden="true" />
            <div className="relative flex h-full flex-col gap-6 px-6 py-8 sm:px-8">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200/80">示例输入</p>
                <div className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-slate-100">
                  “这段话看起来特别像机器写的，请帮我换种自然口吻表达。”
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200/80">改写结果</p>
                <div className="rounded-2xl bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-100 ring-1 ring-white/10">
                  “这段文字的语气过于机械化了，可以帮我换个更自然的表述方式吗？”
                </div>
              </div>
              <p className="text-xs text-slate-200/80">
                * 所有请求均通过安全加密传输，隐私有保障。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[{
          title: '写作助手',
          description: '智能识别原文意图，重新组织结构，避免 AI 检测提示。',
          icon: '✍️',
        }, {
          title: '多场景适配',
          description: '支持营销文案、论文摘要、社交媒体帖子等一键切换语气。',
          icon: '🌈',
        }, {
          title: '团队协作',
          description: '保存常用模版并与团队分享，保持品牌语气一致。',
          icon: '🤝',
        }].map((feature) => (
          <article
            key={feature.title}
            className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-md shadow-indigo-500/10 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20 dark:border-slate-700/70 dark:bg-slate-900/70"
          >
            <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-300/30 via-sky-200/20 to-purple-200/30 blur-2xl transition group-hover:scale-110" aria-hidden="true" />
            <div className="relative flex h-full flex-col gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">
                {feature.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

