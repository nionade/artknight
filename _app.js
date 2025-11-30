// pages/_app.js
import '../styles/globals.css'
import { useState } from 'react'
import Layout from '../components/Layout'

// simple fake wallet generator
function generateWallet(username) {
  const base = Array.from(username + Date.now())
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
  return '0x' + base.slice(0, 40)
}

export default function App({ Component, pageProps }) {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [signupName, setSignupName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupCode, setSignupCode] = useState('')

  const [walletAddress, setWalletAddress] = useState(null)
  const [walletNfts, setWalletNfts] = useState([]) // stores { nftId, fileName, shaHash }

  function handleLogout() {
    setUsername('')
    setPassword('')
    setWalletAddress(null)
    setWalletNfts([])
  }

  function handleLoginSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    if (!walletAddress) setWalletAddress(generateWallet(username))
    setShowAuth(false)
  }

  function handleSignupSubmit(e) {
    e.preventDefault()
    if (!signupName || !signupPassword || !signupCode) return
    setUsername(signupName)
    setPassword(signupPassword)
    if (!walletAddress) setWalletAddress(generateWallet(signupName))
    setShowAuth(false)
  }

  return (
    <Layout
      username={username}
      walletAddress={walletAddress}
      onShowAuth={() => setShowAuth(true)}
      onLogout={handleLogout}
    >
      {/* Auth modal (login / signup) */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {authMode === 'login' ? 'Login to ArtKnight' : 'Sign up for ArtKnight'}
              </h2>
              <button onClick={() => setShowAuth(false)} className="text-slate-400 text-xl">
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-4 text-sm">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-lg border text-center ${
                  authMode === 'login' ? 'bg-slate-800 border-teal-400' : 'border-slate-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 rounded-lg border text-center ${
                  authMode === 'signup' ? 'bg-slate-800 border-teal-400' : 'border-slate-700'
                }`}
              >
                Sign up
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3 text-sm">
                <input
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-teal-400"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-teal-400"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-teal-400 text-slate-950 font-semibold hover:bg-teal-300"
                >
                  Continue
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-3 text-sm">
                <input
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-teal-400"
                  placeholder="Name"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-teal-400"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                />
                <input
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-teal-400"
                  placeholder="Verification code (demo: anything)"
                  value={signupCode}
                  onChange={e => setSignupCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-teal-400 text-slate-950 font-semibold hover:bg-teal-300"
                >
                  Create account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Page content. All pages receive username, walletAddress and walletNfts */}
      <Component
        {...pageProps}
        username={username}
        walletAddress={walletAddress}
        walletNfts={walletNfts}
        setWalletNfts={setWalletNfts}
      />
    </Layout>
  )
}
