export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { hash } = req.body || {}

  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'Missing hash' })
  }

  if (hash.trim().length === 64) {
    return res.json({ registered: true, owner: '0xAbC...123', date: '2024-11-01' })
  }

  return res.json({ registered: false })
}