const UPSTREAM = 'https://hr-learning-system-cn.xhfpoaco78813.chatgpt.site/api/';
const ALLOWED_ORIGIN = 'https://xhfpoaco78813-stack.github.io';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path || ''];
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  const target = UPSTREAM + parts.map(encodeURIComponent).join('/') + (query.size ? '?' + query : '');
  const headers = {'Content-Type': 'application/json'};
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.send(body);
  } catch (error) {
    return res.status(502).json({error: '正式版服务暂时无法连接，请稍后重试'});
  }
}

