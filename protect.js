import { useEffect, useMemo, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

// perceptual-style hash (demo)
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

// SHA-256
async function computeSHA256(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// simple device fingerprint (no PII, just browser info)
function getDeviceFingerprint() {
  if (typeof window === 'undefined') return ''
  const raw =
    navigator.userAgent +
    '|' +
    window.screen.width +
    'x' +
    window.screen.height +
    '|' +
    (navigator.language || '')
  return btoa(unescape(encodeURIComponent(raw))).slice(0, 32)
}

export default function Protect({ username, walletAddress, walletNfts = [], setWalletNfts }) {
  const [deviceFingerprint, setDeviceFingerprint] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verifiedOnce, setVerifiedOnce] = useState(false)

  const [uploads, setUploads] = useState([]) // [{file, shaHash, pHash, status, message, nftId?}]
  const [apiLoading, setApiLoading] = useState(false)

  useEffect(() => {
    setDeviceFingerprint(getDeviceFingerprint())
  }, [])

  const onDropUpload = useCallback(
    async acceptedFiles => {
      if (!username) {
        alert('Please login or sign up first.')
        return
      }
      if (!verifiedOnce) {
        alert('Complete device verification before uploading.')
        return
      }
      if (!acceptedFiles.length) return

      const newEntries = acceptedFiles.map(f => ({
        file: f,
        shaHash: '',
        pHash: '',
        status: 'hashing',
        message: 'Generating SHA‑256 and pHash…'
      }))
      setUploads(prev => [...prev, ...newEntries])

      let startIndex = uploads.length
      for (let i = 0; i < newEntries.length; i++) {
        const idx = startIndex + i
        const f = newEntries[i].file
        try {
          const [sha, ph] = await Promise.all([computeSHA256(f), computeSimplePHash(f)])
          setUploads(prev => {
            const copy = [...prev]
            copy[idx] = {
              ...copy[idx],
              shaHash: sha,
              pHash: ph,
              status: 'ready',
              message: 'Ready to verify & mint.'
            }
            return copy
          })
        } catch {
          setUploads(prev => {
            const copy = [...prev]
            copy[idx] = {
              ...copy[idx],
              status: 'error',
              message: 'Error generating hashes.'
            }
            return copy
          })
        }
      }
    },
    [username, verifiedOnce, uploads.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropUpload,
    accept: { 'image/*': [] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024
  })

  const dropzoneStyle = useMemo(
    () => ({
      border: isDragActive ? '2px dashed #22f3ea' : '2px dashed rgba(255,255,255,0.1)',
      background: isDragActive ? 'rgba(34,243,234,0.08)' : 'rgba(15,23,42,0.6)'
    }),
    [isDragActive]
  )

  function handleVerificationSubmit(e) {
    e.preventDefault()
    if (!verificationCode) {
      alert('Enter verification code (demo: any value).')
      return
    }
    setVerifiedOnce(true)
  }

  async function verifyAndMintSingle(index) {
    const entry = uploads[index]
    if (!entry || !entry.file || !entry.shaHash || !entry.pHash) return
    if (!username) {
      alert('Please login first.')
      return
    }

    setApiLoading(true)
    setUploads(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], status: 'verifying', message: 'Checking registry…' }
      return copy
    })

    try {
      // 1) registry check
      const registryRes = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'register',
          username,
          shaHash: entry.shaHash,
          pHash: entry.pHash,
          fileName: entry.file.name,
          deviceFingerprint,
          verificationCode
        })
      })
      const data = await registryRes.json()
      if (!registryRes.ok) {
        setUploads(prev => {
          const copy = [...prev]
          copy[index] = { ...copy[index], status: 'error', message: data.error || 'Server error' }
          return copy
        })
        return
      }

      // 1.a New fingerprint: mint NFT
      if (data.status === 'minted') {
        setUploads(prev => {
          const copy = [...prev]
          copy[index] = { ...copy[index], status: 'minting', message: 'Minting & anchoring…' }
          return copy
        })

        const [cardanoRes, polygonRes, midnightRes, hydraRes] = await Promise.all([
          fetch('/api/cardano-anchor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              shaHash: entry.shaHash,
              pHash: entry.pHash,
              fileName: entry.file.name
            })
          }).then(r => r.json()),
          fetch('/api/polygon-mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, shaHash: entry.shaHash, fileName: entry.file.name })
          }).then(r => r.json()),
          fetch('/api/midnight-proof', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, shaHash: entry.shaHash, pHash: entry.pHash })
          }).then(r => r.json()),
          fetch('/api/hydra-channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, shaHash: entry.shaHash })
          }).then(r => r.json())
        ])

        const nftId = 'NFT_' + polygonRes.tokenId

        // store NFT in wallet
        if (typeof setWalletNfts === 'function') {
          setWalletNfts(prev => [
            ...prev,
            {
              nftId,
              fileName: entry.file.name,
              shaHash: entry.shaHash
            }
          ])
        }

        setUploads(prev => {
          const copy = [...prev]
          copy[index] = {
            ...copy[index],
            status: 'minted',
            message:
              'Minted on Polygon + anchored on Cardano + ZK proof + Hydra update (simulated).',
            cardano: cardanoRes,
            polygon: polygonRes,
            midnight: midnightRes,
            hydra: hydraRes,
            nftId
          }
          return copy
        })
      }
      // 1.b Exact duplicate
      else if (data.status === 'already_registered') {
        setUploads(prev => {
          const copy = [...prev]
          copy[index] = {
            ...copy[index],
            status: 'duplicate',
            message: `Already registered to ${data.owner}.`
          }
          return copy
        })
      }
      // 1.c Altered copy
      else if (data.status === 'altered_copy') {
        setUploads(prev => {
          const copy = [...prev]
          copy[index] = {
            ...copy[index],
            status: 'altered',
            message: 'Altered copy detected – belongs to another user.'
          }
          return copy
        })
      } else {
        setUploads(prev => {
          const copy = [...prev]
          copy[index] = {
            ...copy[index],
            status: 'error',
            message: data.message || 'Unknown response.'
          }
          return copy
        })
      }
    } catch {
      setUploads(prev => {
        const copy = [...prev]
        copy[index] = {
          ...copy[index],
          status: 'error',
          message: 'Network error calling backend.'
        }
        return copy
      })
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <section className="space-y-10">
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">Protect your artwork</h1>
      <p className="text-slate-300 text-sm max-w-xl mb-6">
        Upload from your own device, generate SHA‑256 and perceptual hashes, check our registry, and
        mint NFTs when fingerprints are unique. The original file is never stored – only hashes,
        chain IDs and timestamps.
      </p>

      {/* Verification */}
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-3 max-w-xl">
        <h2 className="text-lg font-semibold">Device verification</h2>
        <p className="text-slate-400 text-xs">
          We bind this session to a simple device fingerprint + verification code so random devices
          can’t easily register work under your name.
        </p>
        <div className="font-mono text-[11px] bg-slate-950/60 border border-slate-700 rounded px-3 py-2 break-all">
          {deviceFingerprint || 'Collecting fingerprint…'}
        </div>
        <form onSubmit={handleVerificationSubmit} className="flex gap-2 mt-2 text-sm">
          <input
            className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-teal-400"
            placeholder="Enter verification code (demo: any value)"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 rounded-lg bg-teal-400 text-slate-950 font-semibold hover:bg-teal-300"
          >
            Verify
          </button>
        </form>
        {verifiedOnce && (
          <p className="text-teal-300 text-xs mt-1">Device verified for this session.</p>
        )}
      </div>

      {/* Upload and status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-3">Upload & fingerprint</h2>
          <div
            {...getRootProps()}
            className="rounded-xl p-8 text-center cursor-pointer transition-colors border-2 border-dashed"
            style={dropzoneStyle}
          >
            <input {...getInputProps()} />
            <p className="text-sm font-semibold mb-1">
              {username ? 'Drag & drop up to 5 artworks' : 'Login / Sign up to begin'}
            </p>
            <p className="text-slate-400 text-xs">PNG, JPG, GIF • Max 10MB each</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl text-xs">
          <h2 className="text-lg font-semibold mb-3">Files in this session</h2>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {uploads.length === 0 ? (
              <p className="text-slate-500 text-xs">No files yet.</p>
            ) : (
              uploads.map((u, idx) => (
                <div
                  key={idx}
                  className="border border-slate-700 rounded-lg p-2 bg-slate-950/40 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-[11px] truncate max-w-[60%]">
                      {u.file.name}
                    </p>
                    <span className="text-[10px] text-slate-400">{u.status}</span>
                  </div>
                  {u.shaHash && (
                    <p className="font-mono text-[9px] text-slate-500">
                      SHA: {u.shaHash.slice(0, 28)}…
                    </p>
                  )}
                  {u.pHash && (
                    <p className="font-mono text-[9px] text-slate-500">
                      pHash: {u.pHash.slice(0, 32)}…
                    </p>
                  )}
                  {u.nftId && (
                    <p className="text-slate-400">
                      NFT: <span className="font-mono">{u.nftId}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-300">{u.message}</p>
                  <button
                    onClick={() => verifyAndMintSingle(idx)}
                    disabled={u.status !== 'ready' || !username || apiLoading}
                    className="mt-1 w-full py-1 rounded bg-teal-400 text-slate-950 text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-300"
                  >
                    Verify & mint
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
