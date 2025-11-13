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
          content: `你是一个专业的文本改写助手。请将用户提供的文本进行改写，使其更加自然、人性化，就像普通人写的一样。

改写要求：
1. 保持原意和核心信息完全不变
2. 去除明显的AI生成痕迹（如过度正式、结构过于规整、用词过于完美等）
3. 使用更自然、口语化的表达方式，但不要过度口语化
4. 保持原文的语气和风格（正式/非正式、严肃/轻松等）
5. 保留专业术语、数字、人名、地名等关键信息不变
6. 保持原文的段落结构和逻辑顺序
7. 改写后的文本长度应与原文相近（±20%以内）
8. 确保改写后的文本流畅、易读，没有语法错误

请直接输出改写后的文本，不要添加任何解释或说明。`,
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

