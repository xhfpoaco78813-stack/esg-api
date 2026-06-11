module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, max_tokens } = req.body || {};
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
      const msg = data.error?.message || data.error?.code || '未知錯誤';
      if (response.status === 401) return res.status(502).json({ error: 'API Key 無效' });
      if (response.status === 402) return res.status(502).json({ error: '餘額不足' });
      if (response.status === 429) return res.status(502).json({ error: '請求過頻，請稍候' });
      return res.status(502).json({ error: 'AI 錯誤：' + msg });
    }

    return res.status(200).json({
      content: [{ type: 'text', text: data.choices[0].message.content }]
    });

  } catch (e) {
    return res.status(502).json({ error: '連線失敗：' + e.message });
  }
};
