/**
 * Vercel Serverless Function - DeepSeek API 代理
 * 保護 DeepSeek API Key 不暴露在前端
 *
 * 環境變數（在 Vercel Dashboard 設定）：
 *   DEEPSEEK_API_KEY = 你的 DeepSeek Key
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 格式錯誤' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定，請聯繫管理員' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: max_tokens || 2000,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.error?.code || '未知錯誤';
      if (response.status === 401) return res.status(502).json({ error: 'API Key 無效，請聯繫管理員' });
      if (response.status === 402) return res.status(502).json({ error: 'API 餘額不足，請聯繫管理員充值' });
      if (response.status === 429) return res.status(502).json({ error: '請求頻率過高，請稍候重試' });
      return res.status(502).json({ error: 'AI 錯誤：' + errMsg });
    }

    // 回傳統一格式
    return res.status(200).json({
      content: [{ type: 'text', text: data.choices[0].message.content }]
    });

  } catch (e) {
    return res.status(502).json({ error: '連線 AI 服務失敗：' + e.message });
  }
}
