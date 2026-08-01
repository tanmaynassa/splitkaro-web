import { useState, useEffect, useRef } from 'react'

const ITEMS = [
  { sr: 1, name: 'Cucumber English', amount: 41 },
  { sr: 2, name: 'Amul Milk', amount: 30 },
  { sr: 3, name: 'Amul Paneer x2', amount: 190 },
  { sr: 4, name: 'Too Yumm Karare', amount: 16 },
]

// Each frame describes the full UI state at that moment
const FRAMES = [
  { screen: 'upload', label: 'Invoice downloaded from Zepto', tags: {}, showSummary: false, showDone: false },
  { screen: 'parsing', label: 'Reading invoice...', tags: {}, showSummary: false, showDone: false },
  { screen: 'items', label: 'Items extracted', tags: { 1: 'shared', 2: 'shared', 3: 'shared', 4: 'shared' }, showSummary: false, showDone: false },
  { screen: 'items', label: 'Milk tagged as yours', tags: { 1: 'shared', 2: 'mine', 3: 'shared', 4: 'shared' }, showSummary: false, showDone: false },
  { screen: 'items', label: 'Karare is Rohan\'s', tags: { 1: 'shared', 2: 'mine', 3: 'shared', 4: 'rohan' }, showSummary: false, showDone: false },
  { screen: 'items', label: 'Split calculated', tags: { 1: 'shared', 2: 'mine', 3: 'shared', 4: 'rohan' }, showSummary: true, showDone: false },
  { screen: 'done', label: 'Logged to Splitwise', tags: { 1: 'shared', 2: 'mine', 3: 'shared', 4: 'rohan' }, showSummary: true, showDone: true },
]

const DURATIONS = [1200, 1000, 1500, 900, 900, 1200, 2200]

const TAG_STYLE = {
  shared: { label: 'Shared', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  mine:   { label: 'You',    bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  kalash: { label: 'Rohan', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
}

export default function InteractiveDemo({ onTryNow }) {
  const [frameIdx, setFrameIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const advance = (idx) => {
      timerRef.current = setTimeout(() => {
        const next = (idx + 1) % FRAMES.length
        setFrameIdx(next)
        advance(next)
      }, DURATIONS[idx] ?? 1500)
    }
    advance(0)
    return () => clearTimeout(timerRef.current)
  }, [])

  const frame = FRAMES[frameIdx]

  // Compute split
  const shared = ITEMS.filter(i => frame.tags[i.sr] === 'shared')
  const sharedEach = shared.reduce((s, i) => s + i.amount, 0) / 2
  const myTotal = ITEMS.filter(i => frame.tags[i.sr] === 'mine').reduce((s, i) => s + i.amount, 0) + sharedEach
  const kalashTotal = ITEMS.filter(i => frame.tags[i.sr] === 'rohan').reduce((s, i) => s + i.amount, 0) + sharedEach

  return (
    <div
      onClick={onTryNow}
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8faff 100%)',
        border: '1.5px solid #d1fae5',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        minHeight: 300,
        padding: '0 0 12px',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 20 }}>
          ▶ Demo
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af', background: 'rgba(255,255,255,0.8)', padding: '3px 10px', borderRadius: 20 }}>
          Tap to try with your bill →
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '0 14px', minHeight: 240 }}>

        {/* Upload screen */}
        {frame.screen === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 12 }}>
            <div style={{ width: 72, height: 72, background: 'white', borderRadius: 16, border: '1.5px solid #d1fae5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>zepto.pdf</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, background: '#16a34a', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Uploading invoice...</span>
            </div>
          </div>
        )}

        {/* Parsing screen */}
        {frame.screen === 'parsing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 12 }}>
            <div style={{ width: 72, height: 72, background: 'white', borderRadius: 16, border: '1.5px solid #d1fae5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>zepto.pdf</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, background: '#16a34a', borderRadius: '50%', opacity: 0.6 + i * 0.2 }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Reading items and prices...</span>
          </div>
        )}

        {/* Items screen */}
        {frame.screen === 'items' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Zepto — 12-07-2026</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>₹277</span>
            </div>

            {ITEMS.map(item => {
              const tag = frame.tags[item.sr] || 'shared'
              const ts = TAG_STYLE[tag]
              return (
                <div key={item.sr} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: ts.bg, border: `1px solid ${ts.border}`,
                  borderRadius: 10, padding: '7px 10px',
                  transition: 'background 0.3s, border-color 0.3s',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>₹{item.amount}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: ts.color,
                    background: 'white', border: `1px solid ${ts.border}`,
                    padding: '2px 8px', borderRadius: 6,
                    transition: 'all 0.3s',
                  }}>
                    {ts.label}
                  </span>
                </div>
              )
            })}

            {frame.showSummary && (
              <div style={{ display: 'flex', justifyContent: 'space-around', background: 'white', border: '1px solid #d1fae5', borderRadius: 10, padding: '8px 12px', marginTop: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>You</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>₹{Math.round(myTotal)}</div>
                </div>
                <div style={{ width: 1, background: '#f3f4f6' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Rohan</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>₹{Math.round(kalashTotal)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done screen */}
        {frame.screen === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 10 }}>
            <span style={{ fontSize: 40 }}>✅</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Logged to Splitwise</span>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Rohan owes you</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>₹{Math.round(kalashTotal)}</div>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>30 seconds. No math. No manual entry.</span>
          </div>
        )}

      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 8 }}>
        {FRAMES.map((_, i) => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i === frameIdx ? 14 : 4,
            background: i === frameIdx ? '#16a34a' : '#d1fae5',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}
