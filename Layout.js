import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Layout({ children, username, walletAddress, onShowAuth, onLogout }) {
  const router = useRouter()

  function isActive(path) {
    return router.pathname === path
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-teal-400/60 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true">
                <path
                  d="M16 3L7 6v7c0 6.1 3.8 11.7 9 13.9c5.2-2.2 9-7.8 9-13.9V6l-9-3z"
                  fill="#020617"
                  stroke="#22d3ee"
                  strokeWidth="1.4"
                />
                <path
                  d="M12 20L16 10l4 10"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 17h6"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <rect x="6" y="8" width="2" height="2" fill="#22d3ee" />
                <rect x="24" y="9" width="2" height="2" fill="#22d3ee" />
                <rect x="9" y="24" width="2" height="2" fill="#22d3ee" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">ArtKnight</p>
              <p className="text-[10px] text-slate-400 leading-tight">On‑chain copyright</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-xs md:text-sm">
            <Link
              href="/"
              className={isActive('/') ? 'text-teal-300' : 'text-slate-300 hover:text-white'}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={isActive('/dashboard') ? 'text-teal-300' : 'text-slate-300 hover:text-white'}
            >
              Dashboard
            </Link>
            <Link
              href="/protect"
              className={isActive('/protect') ? 'text-teal-300' : 'text-slate-300 hover:text-white'}
            >
              Protect
            </Link>
            <Link
              href="/claim"
              className={isActive('/claim') ? 'text-teal-300' : 'text-slate-300 hover:text-white'}
            >
              Raise a claim
            </Link>
          </nav>

          {/* Right side: user + buttons */}
          <div className="flex items-center gap-3 text-xs md:text-sm">
            {walletAddress && (
              <span className="hidden md:inline text-slate-400 font-mono">
                {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
              </span>
            )}
            {username && <span className="hidden md:inline text-slate-300">Hi, {username}</span>}
            <button
              onClick={onShowAuth}
              className="py-2 px-4 rounded-lg bg-teal-400 text-slate-950 font-semibold hover:bg-teal-300 transition-colors"
            >
              {username ? 'Switch account' : 'Get started'}
            </button>
            {username && (
              <button
                onClick={onLogout}
                className="py-2 px-3 rounded-lg border border-slate-600 text-xs hover:bg-slate-800"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">{children}</main>
    </div>
  )
}
