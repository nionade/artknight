export default function Dashboard({ username, walletAddress, walletNfts = [] }) {
  const profileInitial = username ? username[0].toUpperCase() : 'A'

  return (
    <section className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold">Dashboard</h1>
        <p className="text-slate-300 text-sm max-w-xl">
          Overview of your artist identity, connected crypto wallet and the NFTs ArtKnight has
          minted for your works.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Artist profile */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold">Artist profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-slate-900">
              {profileInitial}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-base">{username || 'Guest artist'}</p>
              <p className="text-slate-400 text-xs">
                This profile is used to sign registrations and dispute claims.
              </p>
            </div>
          </div>
        </div>

        {/* Wallet overview */}
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold">Crypto wallet</h2>
          <p className="text-slate-300 text-sm">
            ArtKnight stores your anchored NFTs and proofs against this wallet. In production this
            would be a real Cardano / Polygon wallet. In this demo it is a locally generated
            address so you can test the flows.
          </p>
          <div>
            <p className="text-xs text-slate-400 mb-1">Connected address</p>
            <div className="font-mono text-xs bg-slate-950/60 border border-slate-700 rounded px-3 py-2 break-all">
              {walletAddress
                ? walletAddress
                : 'No wallet yet. Use “Get started” to create an account and auto‑generate a demo address.'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mt-3">
            <div className="bg-slate-950/60 rounded-xl p-3">
              <p className="text-slate-400">Networks</p>
              <p className="mt-1">Cardano • Polygon</p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3">
              <p className="text-slate-400">Proof types</p>
              <p className="mt-1">NFT • Anchor • ZKP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet NFTs list */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 space-y-3">
        <h2 className="text-lg font-semibold mb-1">NFTs in your wallet</h2>
        {walletNfts.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No NFTs yet. Use the Protect page to upload and mint your first artwork.
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {walletNfts.map((nft, idx) => (
              <li
                key={idx}
                className="border border-slate-700 rounded-lg p-3 bg-slate-950/40 flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm truncate max-w-[60%]">
                    {nft.fileName}
                  </span>
                  <span className="font-mono text-[11px] text-teal-300">{nft.nftId}</span>
                </div>
                <p className="text-slate-400">
                  SHA: <span className="font-mono">{nft.shaHash.slice(0, 20)}…</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
