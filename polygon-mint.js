// POST /api/polygon-mint
// body: { shaHash, username, fileName }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shaHash, username, fileName } = req.body || {}
  if (!shaHash || !username || !fileName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const fakeTokenId = 'poly_' + shaHash.slice(0, 8)
  const fakeTxHash = '0x' + shaHash.slice(0, 64)

  return res.json({
    ok: true,
    tokenId: fakeTokenId,
    txHash: fakeTxHash,
    network: 'polygon-amoy',
    message: 'Polygon ERC-721 NFT minted (simulated).'
  })
}
