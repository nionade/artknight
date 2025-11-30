// POST /api/midnight-proof
// body: { shaHash, pHash, username }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { shaHash, pHash, username } = req.body || {}
  if (!shaHash || !pHash || !username) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  // Demo ZKP: "user owns a work whose fingerprint = shaHash/pHash" without revealing file
  const fakeProofId = 'midnight_proof_' + shaHash.slice(0, 10)

  return res.json({
    ok: true,
    proofId: fakeProofId,
    statement: 'User proves ownership of content fingerprint without revealing data.',
    message: 'Midnight-style ZKP generated (simulated).'
  })
}
