import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, isLoggedIn } from '../utils/api'

export default function Split({ user, flatmates }) {
  const navigate = useNavigate()
  const [parsed, setParsed] = useState(null)
  const [tags, setTags] = useState({})
  const [restAmong, setRestAmong] = useState('everyone')
  const [restPeople, setRestPeople] = useState([])
  const [paidBy, setPaidBy] = useState('mine') // 'mine' or flatmate splitwise_user_id
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [doneData, setDoneData] = useState(null)
  const [error, setError] = useState(null)
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)

  useEffect(() => {
    // Check URL params first (from iOS Shortcut)
    const urlParams = new URLSearchParams(window.location.search)
    const urlData = urlParams.get('data')

    let data
    if (urlData) {
      try {
        data = JSON.parse(atob(urlData))
        sessionStorage.setItem('splitkaro_parsed', JSON.stringify(data))
        // Clean URL
        window.history.replaceState({}, '', '/split')
      } catch (e) {
        console.error('Failed to decode URL data:', e)
      }
    }

    if (!data) {
      const stored = sessionStorage.getItem('splitkaro_parsed')
      if (stored) data = JSON.parse(stored)
    }

    if (data) {
      setParsed(data)
      const defaultTags = {}
      data.items.forEach(item => { defaultTags[item.sr] = 'shared' })
      setTags(defaultTags)
    } else {
      navigate('/')
    }
  }, [])

  const allPeople = useMemo(() => {
    const people = [{ id: 'mine', name: 'You' }]
    flatmates.forEach(f => people.push({ id: f.splitwise_user_id, name: f.name.split(' ')[0] }))
    return people
  }, [flatmates])

  const cycleTag = (sr) => {
    const options = ['shared', 'mine', ...flatmates.map(f => String(f.splitwise_user_id))]
    const current = tags[sr] || 'shared'
    const currentIdx = options.indexOf(current)
    const next = options[(currentIdx + 1) % options.length]
    setTags(prev => ({ ...prev, [sr]: next }))
  }

  const getTagLabel = (tag) => {
    if (tag === 'shared') return 'Shared'
    if (tag === 'mine') return 'You'
    if (tag?.startsWith('split:')) {
      const ids = tag.split(':')[1].split(',')
      const names = ids.map(id => {
        if (id === 'mine') return 'You'
        const fm = flatmates.find(f => String(f.splitwise_user_id) === id)
        return fm ? fm.name.split(' ')[0] : id
      })
      return names.join(' + ')
    }
    const fm = flatmates.find(f => String(f.splitwise_user_id) === tag)
    return fm ? fm.name.split(' ')[0] : 'Shared'
  }

  const getTagColor = (tag) => {
    if (tag === 'shared') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (tag === 'mine') return 'bg-green-100 text-green-700 border-green-200'
    if (tag?.startsWith('split:')) return 'bg-purple-100 text-purple-700 border-purple-200'
    return 'bg-orange-100 text-orange-700 border-orange-200'
  }

  // Partial split modal state
  const [splitModal, setSplitModal] = useState(null) // sr number or null
  const [splitSelection, setSplitSelection] = useState([])

  const openSplitModal = (sr) => {
    const current = tags[sr]
    if (current?.startsWith('split:')) {
      setSplitSelection(current.split(':')[1].split(','))
    } else {
      setSplitSelection(['mine'])
    }
    setSplitModal(sr)
  }

  const confirmSplit = () => {
    if (splitSelection.length >= 2) {
      setTags(prev => ({ ...prev, [splitModal]: `split:${splitSelection.join(',')}` }))
    }
    setSplitModal(null)
  }

  const toggleSplitPerson = (id) => {
    setSplitSelection(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // Compute split
  const splitResult = useMemo(() => {
    if (!parsed) return null

    let myTotal = 0, sharedTotal = 0
    const fmTotals = {}
    flatmates.forEach(f => { fmTotals[f.splitwise_user_id] = 0 })
    const splitItems = [] // items split between specific people

    parsed.items.forEach(item => {
      const tag = tags[item.sr]
      if (tag === 'mine') {
        myTotal += item.amount
      } else if (tag === 'shared') {
        sharedTotal += item.amount
      } else if (tag?.startsWith('split:')) {
        splitItems.push({ item, people: tag.split(':')[1].split(',') })
      } else {
        // flatmate personal
        const fmId = parseInt(tag)
        if (fmTotals[fmId] !== undefined) fmTotals[fmId] += item.amount
      }
    })

    // Determine who splits shared items
    let sharedSplitters = 1 + flatmates.length // default: everyone
    let sharedPool = sharedTotal + (parsed.extra_charges || 0)

    if (restAmong === 'custom' && restPeople.length > 0) {
      sharedSplitters = restPeople.length
      if (restPeople.includes('mine')) sharedSplitters = restPeople.length
    }

    const sharedEach = sharedSplitters > 0 ? sharedPool / sharedSplitters : 0

    // Build shares
    const shares = { mine: myTotal }
    flatmates.forEach(f => {
      shares[f.splitwise_user_id] = fmTotals[f.splitwise_user_id] || 0
    })

    // Add shared portion
    if (restAmong === 'everyone' || restPeople.length === 0) {
      shares.mine += sharedEach
      flatmates.forEach(f => { shares[f.splitwise_user_id] += sharedEach })
    } else {
      restPeople.forEach(id => {
        if (id === 'mine') shares.mine += sharedEach
        else shares[id] = (shares[id] || 0) + sharedEach
      })
    }

    // Add partial splits
    splitItems.forEach(({ item, people }) => {
      const each = item.amount / people.length
      people.forEach(id => {
        if (id === 'mine') shares.mine += each
        else shares[parseInt(id)] = (shares[parseInt(id)] || 0) + each
      })
    })

    const total = parsed.total || parsed.items_total
    
    // Round and fix rounding errors
    Object.keys(shares).forEach(k => { shares[k] = Math.round(shares[k] * 100) / 100 })
    const sharesSum = Object.values(shares).reduce((a, b) => a + b, 0)
    if (Math.abs(sharesSum - total) < 1) {
      shares.mine += Math.round((total - sharesSum) * 100) / 100
    }

    return { shares, total, sharedEach: Math.round(sharedEach * 100) / 100 }
  }, [parsed, tags, flatmates, restAmong, restPeople])

  const handleConfirm = async () => {
    if (!user || !flatmates.length) {
      setShowSetupPrompt(true)
      return
    }

    setConfirming(true)
    setError(null)

    try {
      const result = await apiCall('/api/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed,
          tags,
          rest_among: restAmong === 'custom' ? restPeople : null,
          paid_by: paidBy,
        }),
      })

      // Save to local history
      try {
        const existing = JSON.parse(localStorage.getItem('sk_history') || '[]')
        const entry = {
          description: parsed.items.slice(0, 2).map(i => i.name.split(' ')[0]).join(', '),
          date: parsed.order_date || new Date().toLocaleDateString('en-IN'),
          total: parsed.total,
          owes: result.owes,
        }
        localStorage.setItem('sk_history', JSON.stringify([entry, ...existing].slice(0, 20)))
      } catch (e) {}

      setDone(true)
      setDoneData(result)
    } catch (e) {
      // Token expired or invalid — redirect to reconnect Splitwise
      if (e.message?.includes('401') || e.message?.includes('Not authenticated') || e.message?.includes('Unauthorized')) {
        localStorage.removeItem('splitkaro_token')
        localStorage.removeItem('splitkaro_user')
        navigate('/setup?reason=reconnect')
        return
      }
      setError(e.message)
    } finally {
      setConfirming(false)
    }
  }

  if (!parsed) return null

  // Done screen
  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Logged to Splitwise!</h2>
        {doneData?.owes && Object.entries(doneData.owes).map(([name, amount]) => (
          <p key={name} className="text-lg text-surface-800">
            {name} owes you <span className="font-bold text-brand-600">₹{amount}</span>
          </p>
        ))}
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={() => { setDone(false); navigate('/') }}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
          >
            New bill
          </button>
          <button
            onClick={async () => {
              try {
                await apiCall('/api/undo', { method: 'POST' })
                setDone(false)
                navigate('/')
              } catch (e) { setError(e.message) }
            }}
            className="px-6 py-3 bg-surface-100 text-surface-800 rounded-xl font-medium hover:bg-surface-200"
          >
            Undo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-48">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-surface-500 text-sm">← Back</button>
        <h1 className="font-bold text-surface-900">
          {parsed.platform} — {parsed.order_date}
        </h1>
        <span className="text-sm text-surface-500">₹{parsed.total}</span>
      </div>

      {parsed.extra_charges > 0 && (
        <p className="text-xs text-surface-500 mb-3 text-center">
          includes ₹{parsed.extra_charges} delivery/fees
        </p>
      )}

      {/* Who paid toggle */}
      <div className="mb-4 p-3 bg-surface-50 border border-surface-200 rounded-xl">
        <p className="text-xs font-medium text-surface-600 mb-2">Who paid the full bill?</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPaidBy('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              paidBy === 'mine'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-surface-700 border-surface-200'
            }`}
          >
            You
          </button>
          {flatmates.map(f => (
            <button
              key={f.splitwise_user_id}
              onClick={() => setPaidBy(String(f.splitwise_user_id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                paidBy === String(f.splitwise_user_id)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-surface-700 border-surface-200'
              }`}
            >
              {f.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {parsed.items.map(item => (
          <div key={item.sr} className="border border-surface-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-900 text-sm truncate">{item.name}</p>
              <p className="text-xs text-surface-500">₹{item.amount}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => cycleTag(item.sr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${getTagColor(tags[item.sr])}`}
              >
                {getTagLabel(tags[item.sr])}
              </button>
              {flatmates.length > 0 && (
                <button
                  onClick={() => openSplitModal(item.sr)}
                  className="w-7 h-7 rounded-lg bg-surface-100 text-surface-800 text-xs flex items-center justify-center hover:bg-surface-200"
                  title="Split between specific people"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rest split among toggle */}
      {flatmates.length > 1 && (
        <div className="mt-6 p-4 bg-surface-50 rounded-xl border border-surface-200">
          <p className="text-sm font-medium text-surface-800 mb-2">
            Shared items split among:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setRestAmong('everyone'); setRestPeople([]) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                restAmong === 'everyone' 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-white border border-surface-200 text-surface-800'
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setRestAmong('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                restAmong === 'custom' 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-white border border-surface-200 text-surface-800'
              }`}
            >
              Select people
            </button>
          </div>
          {restAmong === 'custom' && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {[{ id: 'mine', name: 'You' }, ...flatmates.map(f => ({ id: String(f.splitwise_user_id), name: f.name.split(' ')[0] }))].map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setRestPeople(prev => 
                      prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    restPeople.includes(p.id)
                      ? 'bg-brand-100 text-brand-700 border border-brand-200'
                      : 'bg-white border border-surface-200 text-surface-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Split modal for partial splits */}
      {splitModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setSplitModal(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-surface-900 mb-1">
              Split this item between:
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              {parsed.items.find(i => i.sr === splitModal)?.name}
            </p>
            <div className="flex gap-2 flex-wrap mb-6">
              {allPeople.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleSplitPerson(String(p.id))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    splitSelection.includes(String(p.id))
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-surface-100 text-surface-800 border-2 border-transparent'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmSplit}
                disabled={splitSelection.length < 2}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium disabled:opacity-30"
              >
                Split between {splitSelection.length} people
              </button>
              <button
                onClick={() => setSplitModal(null)}
                className="px-4 py-3 bg-surface-100 text-surface-800 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup prompt modal */}
      {showSetupPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="font-semibold text-surface-900 text-lg mb-2">Connect Splitwise</h3>
            <p className="text-sm text-surface-500 mb-6">
              To log this split, connect your Splitwise account. Takes 1 minute.
            </p>
            <button
              onClick={() => navigate('/setup')}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium mb-3"
            >
              Connect Splitwise
            </button>
            <button
              onClick={() => {
                // Copy summary to clipboard
                const lines = [`Split — ${parsed.order_date}`, '']
                parsed.items.forEach(item => {
                  lines.push(`${item.name} ₹${item.amount} — ${getTagLabel(tags[item.sr])}`)
                })
                if (splitResult) {
                  lines.push('')
                  Object.entries(splitResult.shares).forEach(([k, v]) => {
                    const name = k === 'mine' ? 'You' : flatmates.find(f => f.splitwise_user_id == k)?.name.split(' ')[0] || k
                    lines.push(`${name}: ₹${v.toFixed(2)}`)
                  })
                }
                navigator.clipboard?.writeText(lines.join('\n'))
                setShowSetupPrompt(false)
              }}
              className="w-full py-3 bg-surface-100 text-surface-800 rounded-xl font-medium"
            >
              Copy split summary instead
            </button>
          </div>
        </div>
      )}

      {/* Fixed bottom summary bar */}
      {splitResult && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 p-4 shadow-lg">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-3">
              {Object.entries(splitResult.shares).map(([key, amount]) => {
                const name = key === 'mine' ? 'You' : flatmates.find(f => f.splitwise_user_id == key)?.name.split(' ')[0] || ''
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-surface-500">{name}</p>
                    <p className="text-lg font-bold text-surface-900">₹{amount.toFixed(0)}</p>
                  </div>
                )
              })}
            </div>
            
            {error && (
              <p className="text-red-600 text-xs mb-2 text-center">{error}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-base hover:bg-brand-700 disabled:opacity-50 transition-all"
            >
              {confirming ? 'Logging...' : 'Log to Splitwise'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
