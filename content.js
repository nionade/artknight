// pages/api/content.js

// Simple in-memory "database"
let contents = [] // { id, username, shaHash, pHash, fileName, deviceFingerprint, status, createdAt }

function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity
  let dist = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++
  }
  return dist
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { mode } = req.body || {}

  // ----------------------------------------
  // 1) Registration / minting flow
  // ----------------------------------------
  // if (mode === 'register') {
  //   const {
  //     username,
  //     shaHash,
  //     pHash,
  //     fileName,
  //     deviceFingerprint,
  //     verificationCode
  //   } = req.body || {}

  //   // extra verification required
  //   if (
  //     !username ||
  //     !shaHash ||
  //     !pHash ||
  //     !fileName ||
  //     !deviceFingerprint ||
  //     !verificationCode
  //   ) {
  //     return res.status(400).json({ error: 'Missing fields' })
  //   }

  //   // In a real app you would check verificationCode against a code
  //   // that was sent to the user, and bind deviceFingerprint to the account.
  //   // Here we just require that the fields exist.

  //   // 1.1 Exact SHA match => already registered
  //   const exact = contents.find(c => c.shaHash === shaHash)
  //   if (exact) {
  //     return res.json({
  //       status: 'already_registered',
  //       owner: exact.username,
  //       item: exact,
  //       message: `Content already registered to ${exact.username}`
  //     })
  //   }

  //   // 1.2 Perceptual (altered copy) match
  //   const SIMILARITY_THRESHOLD = 10
  //   const similar = contents
  //     .map(c => ({ c, dist: hammingDistance(c.pHash, pHash) }))
  //     .filter(x => x.dist <= SIMILARITY_THRESHOLD)
  //     .sort((a, b) => a.dist - b.dist)[0]

  //   if (similar) {
  //     return res.json({
  //       status: 'altered_copy',
  //       owner: similar.c.username,
  //       item: similar.c,
  //       distance: similar.dist,
  //       message: 'Content appears to be an altered copy of existing protected work.'
  //     })
  //   }

  //   // 1.3 New registration allowed
  //   const newItem = {
  //     id: contents.length + 1,
  //     username,
  //     shaHash,
  //     pHash,
  //     fileName,
  //     deviceFingerprint, // store which device registered it
  //     status: 'Approved',
  //     createdAt: new Date().toISOString()
  //   }
  //   contents.push(newItem)

  //   return res.json({
  //     status: 'minted',
  //     message: 'Fingerprint is unique. Ready to mint & anchor.',
  //     item: newItem
  //   })
  // // }
//   if (mode === 'register') {
//   const {
//     username,
//     shaHash,
//     pHash,
//     fileName,
//     deviceFingerprint,
//     verificationCode
//   } = req.body || {}

//   if (
//     !username ||
//     !shaHash ||
//     !pHash ||
//     !fileName ||
//     !deviceFingerprint ||
//     !verificationCode
//   ) {
//     return res.status(400).json({ error: 'Missing fields' })
//   }

//   // 1) Exact SHA match: if any existing record has the same hash,
//   // it is already registered – this hits on the SECOND call.
//   const exact = contents.find(c => c.shaHash === shaHash)
//   if (exact) {
//     return res.json({
//       status: 'already_registered',
//       owner: exact.username,
//       item: exact,
//       message: `Content already registered to ${exact.username}`
//     })
//   }

//   // 2) Perceptual (altered copy) match
//   const SIMILARITY_THRESHOLD = 10
//   const similar = contents
//     .map(c => ({ c, dist: hammingDistance(c.pHash, pHash) }))
//     .filter(x => x.dist <= SIMILARITY_THRESHOLD)
//     .sort((a, b) => a.dist - b.dist)[0]

//   if (similar) {
//     return res.json({
//       status: 'altered_copy',
//       owner: similar.c.username,
//       item: similar.c,
//       distance: similar.dist,
//       message: 'Content appears to be an altered copy of existing protected work.'
//     })
//   }

//   // 3) New registration: FIRST time only
//   const newItem = {
//     id: contents.length + 1,
//     username,
//     shaHash,
//     pHash,
//     fileName,
//     deviceFingerprint,
//     status: 'Approved',
//     createdAt: new Date().toISOString()
//   }

//   // Important: push BEFORE returning, so the second upload can detect it.
//   contents.push(newItem)

//   return res.json({
//     status: 'minted',
//     message: 'Fingerprint is unique. Ready to mint & anchor.',
//     item: newItem
//   })
// }
// inside pages/api/content.js

if (mode === 'register') {
  const {
    username,
    shaHash,
    pHash,
    fileName,
    deviceFingerprint,
    verificationCode
  } = req.body || {}

  if (
    !username ||
    !shaHash ||
    !pHash ||
    !fileName ||
    !deviceFingerprint ||
    !verificationCode
  ) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  // -------------------------------
  // 1) EXACT match on SHA-256 hash
  // -------------------------------
  const exact = contents.find(c => c.shaHash === shaHash)
  if (exact) {
    return res.json({
      status: 'already_registered',
      owner: exact.username,
      item: exact,
      message: `Content already registered to ${exact.username} (exact fingerprint match).`
    })
  }

  // ----------------------------------------------------
  // 2) SIMILAR match on perceptual hash (pHash distance)
  // ----------------------------------------------------
  const SIMILARITY_THRESHOLD = 10
  const similar = contents
    .map(c => ({ c, dist: hammingDistance(c.pHash, pHash) }))
    .filter(x => x.dist <= SIMILARITY_THRESHOLD)
    .sort((a, b) => a.dist - b.dist)[0]

  if (similar) {
    return res.json({
      status: 'already_registered',
      owner: similar.c.username,
      item: similar.c,
      distance: similar.dist,
      message:
        'A visually similar fingerprint is already registered to another user (perceptual hash match).'
    })
  }

  // --------------------------------------------
  // 3) NO existing hash: mint + anchor permitted
  // --------------------------------------------
  const newItem = {
    id: contents.length + 1,
    username,
    shaHash,
    pHash,
    fileName,
    deviceFingerprint,
    status: 'Approved',
    createdAt: new Date().toISOString()
  }

  // store so future uploads see it immediately
  contents.push(newItem)

  return res.json({
    status: 'minted',
    message: 'Fingerprint is unique. Ready to mint & anchor.',
    item: newItem
  })
}

  // ----------------------------------------
  // 2) Claim / dispute flow
  // ----------------------------------------
  // if (mode === 'claim') {
  //   const { claimant, shaHash, pHash, fileName, claimType, evidenceCount } = req.body || {}

  //   if (!claimant || !shaHash || !pHash || !fileName) {
  //     return res.status(400).json({ error: 'Missing fields' })
  //   }

  //   const SIMILARITY_THRESHOLD = 10
  //   let best = null

  //   for (const c of contents) {
  //     const d = hammingDistance(c.pHash, pHash)
  //     if (!best || d < best.dist) {
  //       best = { item: c, dist: d }
  //     }
  //   }

  //   if (!best || best.dist > SIMILARITY_THRESHOLD) {
  //     return res.json({
  //       status: 'no_match',
  //       message:
  //         'No close fingerprint found in the registry. There is no strong prior owner on record.'
  //     })
  //   }

  //   const original = best.item
  //   const claimantIsOriginal = original.username === claimant

  //   return res.json({
  //     status: 'resolved',
  //     originalOwner: original.username,
  //     claimant,
  //     sameUser: claimantIsOriginal,
  //     evidence: {
  //       matchedId: original.id,
  //       matchedFile: original.fileName,
  //       distance: best.dist,
  //       registeredAt: original.createdAt,
  //       claimType: claimType || 'unspecified',
  //       evidenceCount: evidenceCount || 0
  //     },
  //     message: claimantIsOriginal
  //       ? 'Claimant already appears to be the original registrant.'
  //       : `Registry suggests original registration by ${original.username} based on earliest fingerprint on record.`
  //   })
  // }
if (mode === 'claim') {
  const { claimant, shaHash, pHash, fileName, claimType, evidenceCount } = req.body || {}

  if (!claimant || !shaHash || !pHash || !fileName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const SIMILARITY_THRESHOLD = 10

  // Find all candidates within threshold, sorted by distance THEN by registration time.
  const candidates = contents
    .map(c => ({
      item: c,
      dist: hammingDistance(c.pHash, pHash)
    }))
    .filter(x => x.dist <= SIMILARITY_THRESHOLD)
    .sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist
      // earliest createdAt wins for equal distance
      return new Date(a.item.createdAt) - new Date(b.item.createdAt)
    })

  if (candidates.length === 0) {
    return res.json({
      status: 'no_match',
      message:
        'No close fingerprint found in the registry. There is no strong prior owner on record.'
    })
  }

  const best = candidates[0]
  const original = best.item
  const claimantIsOriginal = original.username === claimant

  return res.json({
    status: 'resolved',
    originalOwner: original.username,
    claimant,
    sameUser: claimantIsOriginal,
    evidence: {
      matchedId: original.id,
      matchedFile: original.fileName,
      distance: best.dist,
      registeredAt: original.createdAt,
      claimType: claimType || 'unspecified',
      evidenceCount: evidenceCount || 0
    },
    message: claimantIsOriginal
      ? 'Claimant already appears to be the original registrant.'
      : `Registry suggests original registration by ${original.username} based on earliest fingerprint on record.`
  })
}

  // ----------------------------------------
  // 3) Unknown mode
  // ----------------------------------------
  return res.status(400).json({ error: 'Unknown mode' })
}
