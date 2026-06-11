module.exports = async function handler(req, res) {
  // 完整 CORS 標頭（iOS Safari 需要）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }

  const messages = body?.messages;
  const max_tokens = body?.max_tokens || 2000;

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
        max_tokens: max_tokens,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || data.error?.code || '未知錯誤';
      if (response.status === 401) return res.status(502).json({ error: 'API Key 無效，請聯繫管理員' });
      if (response.status === 402) return res.status(502).json({ error: '餘額不足，請聯繫管理員充值' });
      if (response.status === 429) return res.status(502).json({ error: '請求過頻，請稍候重試' });
      return res.status(502).json({ error: 'AI 錯誤：' + msg });
    }

    return res.status(200).json({
      content: [{ type: 'text', text: data.choices[0].message.content }]
    });

  } catch (e) {
    return res.status(502).json({ error: '連線失敗：' + e.message });
  }
};
