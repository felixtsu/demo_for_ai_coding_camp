export async function rewriteText(text: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的文字改寫助手。請將用戶提供的文字進行改寫，使其更加自然、人性化，就像普通人寫的一樣。

改寫要求：
1. 保持原意和核心資訊完全不變
2. 去除明顯的AI生成痕跡（如過度正式、結構過於規整、用詞過於完美等）
3. 使用更自然、口語化的表達方式，但不要過度口語化
4. 保持原文的語氣和風格（正式/非正式、嚴肅/輕鬆等）
5. 保留專業術語、數字、人名、地名等關鍵資訊不變
6. 保持原文的段落結構和邏輯順序
7. 改寫後的文字長度應與原文相近（±20%以內）
8. 確保改寫後的文字流暢、易讀，沒有語法錯誤

請直接輸出改寫後的文字，不要添加任何解釋或說明。`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

