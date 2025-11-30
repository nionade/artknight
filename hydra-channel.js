// POST /api/hydra-channel
// body: { username, shaHash }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, shaHash } = req.body || {}
  if (!username || !shaHash) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const fakeChannelId = 'hydra_channel_' + username
  const fakeOffchainId = 'hydra_offchain_tx_' + shaHash.slice(0, 12)

  return res.json({
    ok: true,
    channelId: fakeChannelId,
    offchainTxId: fakeOffchainId,
    message: 'Hydra off-chain update recorded (simulated) to batch future claims.'
  })
}
