import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF, apiCall } from '../utils/api'
import InteractiveDemo from '../components/InteractiveDemo'

export default function Landing({ user, flatmates }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Parsing invoice...')
  const [error, setError] = useState(null)
  const [balances, setBalances] = useState(null)
  const [history, setHistory] = useState([])
  const [showPWA, setShowPWA] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()

  // Load balances and history when user is set up
  useEffect(() => {
    if (user && flatmates.length > 0) {
      fetchBalances()
      loadHistory()
    }
  }, [user, flatmates])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const visits = parseInt(localStorage.getItem('sk_visits') || '0') + 1
      localStorage.setItem('sk_visits', visits)
      if (visits >= 2 && !localStorage.getItem('sk_pwa_dismissed')) {
        setShowPWA(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const fetchBalances = async () => {
    try {
      const data = await apiCall('/api/balances')
      setBalances(data)
    } catch (e) {
      // Silently fail — not critical
    }
  }

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('sk_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch (e) {}
  }

  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF invoice')
      return
    }

    setLoading(true)
    setError(null)

    // Cold start handling — show waiting message after 5s
    const slowTimer = setTimeout(() => {
      setLoadingMsg('Server is waking up, this may take 30-60 seconds on first use...')
    }, 5000)

    try {
      const parsed = await uploadPDF(file)
      sessionStorage.setItem('splitkaro_parsed', JSON.stringify(parsed))
      navigate('/split')
    } catch (e) {
      setError(e.message || 'Failed to parse invoice. Try again.')
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
      setLoadingMsg('Parsing invoice...')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setShowPWA(false)
      setDeferredPrompt(null)
    }
  }

  const dismissPWA = () => {
    setShowPWA(false)
    localStorage.setItem('sk_pwa_dismissed', '1')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-16">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-surface-900">
          🛒 Split<span className="text-brand-600">Karo</span>
        </h1>
        <p className="text-surface-500 mt-1 text-sm">
          grocery bills → splitwise, in 30 seconds
        </p>
      </div>

      {/* PWA install banner */}
      {showPWA && (
        <div className="mb-4 p-3 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-900">📱 Add to home screen</p>
            <p className="text-xs text-surface-500">Faster access + share PDFs directly</p>
          </div>
          <div className="flex gap-2">
            <button onClick={installPWA} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg font-medium">Add</button>
            <button onClick={dismissPWA} className="px-3 py-1.5 text-surface-500 text-xs">Later</button>
          </div>
        </div>
      )}

      {/* Status bar */}
      {user && flatmates.length > 0 && (
        <div className="mb-4 p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-700 font-medium">✅ {user.name}</p>
            <p className="text-xs text-brand-600">
              Splitting with {flatmates.map(f => f.name.split(' ')[0]).join(', ')}
            </p>
          </div>
          <a href="/setup" className="text-xs text-brand-600 underline">Change</a>
        </div>
      )}

      {/* Balance dashboard */}
      {balances && balances.balances && balances.balances.length > 0 && (
        <div className="mb-5 p-4 bg-white border border-surface-200 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Current Balances</p>
          <div className="space-y-2">
            {balances.balances.map((b, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-surface-800">{b.name}</span>
                <span className={`text-sm font-semibold ${b.amount > 0 ? 'text-brand-600' : 'text-red-500'}`}>
                  {b.amount > 0 ? `owes you ₹${b.amount}` : `you owe ₹${Math.abs(b.amount)}`}
                </span>
              </div>
            ))}
          </div>
          {balances.net !== undefined && (
            <div className="mt-3 pt-3 border-t border-surface-100 flex justify-between">
              <span className="text-xs text-surface-500">Net</span>
              <span className={`text-xs font-semibold ${balances.net >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                {balances.net >= 0 ? `you're owed ₹${balances.net}` : `you owe ₹${Math.abs(balances.net)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Interactive demo — only for users not yet set up */}
      {!user && (
        <div className="mb-6">
          <InteractiveDemo onTryNow={() => fileRef.current?.click()} />
        </div>
      )}

      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${dragging ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-surface-200 hover:border-brand-500 hover:bg-brand-50'}
          ${loading ? 'opacity-70 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

        {loading ? (
          <>
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-surface-800 font-medium">Parsing invoice...</p>
            {loadingMsg !== 'Parsing invoice...' && (
              <p className="text-surface-500 text-xs mt-2 max-w-xs mx-auto">{loadingMsg}</p>
            )}
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-surface-800 font-semibold text-lg">Upload grocery invoice</p>
            <p className="text-surface-500 text-sm mt-2">Tap here or drag & drop your PDF</p>
            <p className="text-surface-500 text-xs mt-3">Works with Zepto & Swiggy Instamart</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          {error.includes('Failed') && (
            <p className="text-xs mt-1 text-red-500">If this is your first use today, the server may be waking up. Wait 30 seconds and try again.</p>
          )}
        </div>
      )}

      {/* Split history */}
      {history.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-surface-800 mb-3">Recent splits</p>
          <div className="space-y-2">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="p-3 bg-white border border-surface-200 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-surface-900 truncate max-w-[180px]">{h.description}</p>
                  <p className="text-xs text-surface-500">{h.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-900">₹{h.total}</p>
                  {h.owes && Object.entries(h.owes).map(([name, amt]) => (
                    <p key={name} className="text-xs text-brand-600">{name} owes ₹{amt}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works — only for new users */}
      {!user && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">How it works</h2>
          <div className="space-y-4">
            {[
              ['Upload the invoice PDF', 'Download from Zepto or Instamart, upload here'],
              ['Tap to tag items', 'Mark each item as yours, a flatmate\'s, or shared'],
              ['Confirm — done', 'Split calculated and logged to Splitwise automatically'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                <div>
                  <p className="font-medium text-surface-800">{title}</p>
                  <p className="text-sm text-surface-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-surface-500 text-center mt-8">Free forever. No account needed to try.</p>
        </div>
      )}
    </div>
  )
}
