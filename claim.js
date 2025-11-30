import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

// re-use hashing helpers
async function computeSimplePHash(file) {
  const imgUrl = URL.createObjectURL(file)
  const img = new Image()
  img.src = imgUrl
  await new Promise((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })
  const size = 32
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = size
  canvas.height = size
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const gray = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    gray.push((r + g + b) / 3)
  }
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length
  const bits = gray.map(v => (v > avg ? 1 : 0)).join('')
  URL.revokeObjectURL(imgUrl)
  return bits
}

async function computeSHA256(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export default function Claim({ username }) {
  const [claimFile, setClaimFile] = useState(null)
  const [claimSha, setClaimSha] = useState('')
  const [claimPhash, setClaimPhash] = useState('')
  const [claimHashing, setClaimHashing] = useState(false)

  const [claimType, setClaimType] = useState('original_author')
  const [claimEvidenceFiles, setClaimEvidenceFiles] = useState([])
  const [claimResult, setClaimResult] = useState(null)
  const [claimLoading, setClaimLoading] = useState(false)

  const onDropClaim = useCallback(
    async acceptedFiles => {
      if (!username) {
        alert('Please login or sign up first.')
        return
      }
      if (!acceptedFiles[0]) return

      const f = acceptedFiles[0]
      setClaimFile(f)
      setClaimResult(null)
      setClaimSha('')
      setClaimPhash('')
      setClaimHashing(true)
      try {
        const [sha, ph] = await Promise.all([computeSHA256(f), computeSimplePHash(f)])
        setClaimSha(sha)
        setClaimPhash(ph)
      } finally {
        setClaimHashing(false)
      }
    },
    [username]
  )

  const {
    getRootProps: getClaimRootProps,
    getInputProps: getClaimInputProps,
    isDragActive: isClaimDragActive
  } = useDropzone({
    onDrop: onDropClaim,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const claimDropStyle = useMemo(
    () => ({
      border: isClaimDragActive ? '2px dashed #fbbf24' : '2px dashed rgba(255,255,255,0.1)',
      background: isClaimDragActive ? 'rgba(251,191,36,0.08)' : 'rgba(15,23,42,0.6)'
    }),
    [isClaimDragActive]
  )

  function handleEvidenceChange(e) {
    setClaimEvidenceFiles(Array.from(e.target.files || []))
  }

  async function handleClaimSubmit() {
    if (!claimFile || !claimSha || !claimPhash || !username) return
    setClaimLoading(true)
    setClaimResult(null)

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'claim',
          claimant: username,
          shaHash: claimSha,
          pHash: claimPhash,
          fileName: claimFile.name,
          claimType,
          evidenceCount: claimEvidenceFiles.length
        })
      })
      const data = await res.json()
      setClaimResult(data)
    } catch {
      setClaimResult({ error: 'Network error' })
    } finally {
      setClaimLoading(false)
    }
  }

  return (
    <section className="space-y-10">
      <h1 className="text-3xl md:text-4xl font-semibold">Raise a claim</h1>
      <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
        If someone registered your work first, upload your original. ArtKnight compares the
        fingerprints and registration timestamps in the registry to estimate who the real author
        is. The decision uses hashes only – the original pixels are never stored.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Claim form */}
        <div className="bg-slate-900/70 border border-amber-400/50 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-lg font-semibold">Your evidence</h2>

          <label className="text-sm text-slate-300">Claim type</label>
          <select
            value={claimType}
            onChange={e => setClaimType(e.target.value)}
            className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="original_author">I am the original author</option>
            <option value="fair_use_dispute">Fair use / license dispute</option>
            <option value="misattribution">Misattribution / wrong credit</option>
          </select>

          <div
            {...getClaimRootProps()}
            className="mt-2 rounded-xl p-8 text-center cursor-pointer transition-colors border-2 border-dashed"
            style={claimDropStyle}
          >
            <input {...getClaimInputProps()} />
            {claimFile ? (
              <div className="space-y-1">
                <p className="font-semibold text-sm">{claimFile.name}</p>
                <p className="text-slate-400 text-xs">
                  {(claimFile.size / 1024 / 1024).toFixed(2)} MB • Image selected
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold mb-1">
                  Drop the content you claim as yours
                </p>
                <p className="text-slate-400 text-xs">
                  Only hashes are compared; the original never leaves your device in a real
                  deployment.
                </p>
              </div>
            )}
          </div>

          {claimHashing && (
            <p className="mt-2 text-amber-300 text-xs animate-pulse">
              Computing hashes for claim…
            </p>
          )}

          <label className="text-sm text-slate-300 mt-2 block">
            Additional evidence (screenshots, contracts, messages)
          </label>
          <input
            type="file"
            multiple
            onChange={handleEvidenceChange}
            className="w-full text-xs text-slate-300 file:bg-amber-400 file:text-slate-950 file:border-0 file:px-3 file:py-1 file:rounded-lg file:text-xs bg-slate-950 border border-slate-700 rounded-lg"
          />
          <p className="text-[11px] text-slate-500">
            In this demo, evidence files are just counted; a production version would store their
            hashes on‑chain as additional proof.
          </p>

          <button
            onClick={handleClaimSubmit}
            disabled={!claimFile || !claimSha || !claimPhash || !username || claimLoading}
            className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-amber-400 to-red-500 text-slate-950 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-300 hover:to-red-400"
          >
            {claimLoading ? 'Evaluating claim…' : 'Submit claim'}
          </button>
        </div>

        {/* Decision summary */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-3">Registry decision (simulated)</h2>
          {!claimResult ? (
            <p className="text-slate-400 text-sm">
              After you submit a claim, this panel summarises who appears to be the original
              registrant based on the earliest fingerprint in the registry.
            </p>
          ) : claimResult.error ? (
            <p className="text-red-400 text-sm">{claimResult.error}</p>
          ) : (
            <div className="text-sm space-y-2">
              <p className="font-semibold text-slate-200">{claimResult.message}</p>
              {claimResult.evidence && (
                <>
                  <p className="text-slate-400">
                    Matched work ID: {claimResult.evidence.matchedId} (
                    {claimResult.evidence.matchedFile})
                  </p>
                  <p className="text-slate-400">
                    Fingerprint distance: {claimResult.evidence.distance}
                  </p>
                  <p className="text-slate-400">
                    Registered at:{' '}
                    {new Date(claimResult.evidence.registeredAt).toLocaleString()}
                  </p>
                  <p className="text-slate-400">
                    Suggested original: {claimResult.originalOwner}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
