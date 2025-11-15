'use client'

import { useState } from 'react'

type FAQItem = {
  id: string
  title: string
  content: string
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    title: '為什麼需要去除 AI 味道？',
    content: '當今 AI 生成內容越來越普遍，但過於機械化的表達方式容易被識別，影響內容的可信度和親和力。我們的工具能幫你將 AI 生成的文字轉換成更自然、更像人類書寫的內容，讓你的文章、報告或文案更具說服力和真實感。無論是學術論文、商業提案還是社群媒體內容，都能呈現出更專業、更貼近讀者的表達方式。',
  },
  {
    id: '2',
    title: '適用於哪些場景？',
    content: '我們的改寫工具適用於多種場景：學術寫作（論文摘要、研究報告）、商業文案（產品介紹、行銷內容）、社群媒體（貼文、評論）、個人創作（部落格、文章）等。無論你需要將 AI 生成的初稿優化得更自然，還是想讓現有內容更具人性化表達，都能快速獲得高品質的改寫結果。',
  },
  {
    id: '3',
    title: '如何確保改寫品質？',
    content: '我們採用先進的語言模型技術，結合語義理解和語氣調節，確保改寫後的內容：保持原意不變、去除明顯 AI 痕跡、使用更自然的表達方式、保留專業術語和關鍵資訊、維持原文風格和語氣。平均 3 秒即可完成改寫，讓你快速獲得優化後的內容，大幅提升工作效率。',
  },
  {
    id: '4',
    title: '與其他改寫工具有什麼不同？',
    content: '我們專注於「去除 AI 味道」，不只是簡單的同義詞替換或語法調整。我們的工具能深度理解語境，智能調節語氣，讓改寫後的文字更像真人書寫。同時支援 Markdown 格式和長文內容，配額每日自動重置，隨時可升級或降級方案，為你提供靈活且可靠的改寫服務。',
  },
  {
    id: '5',
    title: '如何開始使用？',
    content: '只需註冊帳號並選擇適合的方案，即可立即開始使用。所有方案都提供安全的訂閱管理，配額每日自動重置。你可以隨時升級或降級方案，無需擔心長期綁約。立即免費體驗，讓你的文字內容更自然、更專業、更具說服力。',
  },
]

export function FAQAccordion() {
  const [openId, setOpenId] = useState<string>('1')

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? '' : id)
  }

  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-12 px-16 py-16">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-center text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
          常見問題
        </h2>
        <p className="text-center text-xl font-normal leading-[1.2] text-[#757575]">
          了解我們的服務與優勢
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        {faqItems.map((item) => {
          const isOpen = openId === item.id
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-2 rounded-lg border border-[#D9D9D9] p-4 ${
                isOpen ? 'bg-white' : 'bg-[#F5F5F5]'
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-[#F0F0F0] active:bg-[#E8E8E8] active:scale-[0.98]"
              >
                <span className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
                  {item.title}
                </span>
                <span className="text-[#1E1E1E]">
                  {isOpen ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12.5L10 7.5L15 12.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="pt-2">
                  <p className="text-base font-normal leading-[1.4] text-[#1E1E1E]">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

