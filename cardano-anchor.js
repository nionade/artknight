// POST /api/cardano-anchor
// body: { shaHash, pHash, username }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shaHash, pHash, username } = req.body || {}
  if (!shaHash || !pHash || !username) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  // Demo: pretend to create a Cardano tx that anchors hashes into metadata
  const fakeTxHash = 'cardano_tx_' + shaHash.slice(0, 16)

  return res.json({
    ok: true,
    txHash: fakeTxHash,
    network: 'cardano-preprod',
    message: 'Content fingerprint anchored on Cardano (simulated).'
  })
}
