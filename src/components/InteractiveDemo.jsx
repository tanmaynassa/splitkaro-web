import { useState, useEffect, useRef } from 'react'

const DEMO_ITEMS = [
  { sr: 1, name: 'Cucumber English', amount: 41 },
  { sr: 2, name: 'Amul Milk', amount: 30 },
  { sr: 3, name: 'Amul Paneer x2', amount: 190 },
  { sr: 4, name: 'Too Yumm Karare', amount: 16 },
]

const STEPS = [
  { id: 'upload', duration: 1400 },
  { id: 'parse', duration: 1200 },
  { id: 'items', duration: 1800 },
  { id: 'tag1', duration: 900 },
  { id: 'tag2', duration: 900 },
  { id: 'summary', duration: 1400 },
  { id: 'done', duration: 2000 },
  { id: 'reset', duration: 600 },
]

const TAGS = {
  shared: { label: 'Shared', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  mine: { label: 'You', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  kalash: { label: 'Kalash', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
}

export default function InteractiveDemo({ onTryNow }) {
  const [step, setStep] = useState('upload')
  const [visibleItems, setVisibleItems] = useState([])
  const [tags, setTags] = useState({ 1: 'shared', 2: 'shared', 3: 'shared', 4: 'shared' })
  const [showSummary, setShowSummary] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const stepRef = useRef(0)
  const timerRef = useRef(null)

  const runSequence = () => {
    stepRef.current = 0

    const next = () => {
      const s = STEPS[stepRef.current]
      if (!s) return

      setStep(s.id)

      if (s.id === 'upload') {
        setUploading(true)
        setParsing(false)
        setVisibleItems([])
        setTags({ 1: 'shared', 2: 'shared', 3: 'shared', 4: 'shared' })
        setShowSummary(false)
        setShowDone(false)
      }
      if (s.id === 'parse') {
        setUploading(false)
        setParsing(true)
      }
      if (s.id === 'items') {
        setParsing(false)
        setVisibleItems([])
        let i = 0
        const showNext = () => {
          if (i < DEMO_ITEMS.length) {
            setVisibleItems(prev => [...prev, DEMO_ITEMS[i]])
            i++
            setTimeout(showNext, 220)
          }
        }
        showNext()
      }
      if (s.id === 'tag1') {
        setTags(prev => ({ ...prev, 2: 'mine' }))
      }
      if (s.id === 'tag2') {
        setTags(prev => ({ ...prev, 4: 'kalash' }))
      }
      if (s.id === 'summary') {
        setShowSummary(true)
      }
      if (s.id === 'done') {
        setShowDone(true)
      }
      if (s.id === 'reset') {
        setShowDone(false)
        setShowSummary(false)
      }

      stepRef.current++
      timerRef.current = setTimeout(next, s.duration)
    }

    next()
  }

  useEffect(() => {
    const startDelay = setTimeout(runSequence, 600)
    return () => {
      clearTimeout(startDelay)
      clearTimeout(timerRef.current)
    }
  }, [])

  // Compute split for summary
  const myItems = DEMO_ITEMS.filter(i => tags[i.sr] === 'mine')
  const kalashItems = DEMO_ITEMS.filter(i => tags[i.sr] === 'kalash')
  const shared = DEMO_ITEMS.filter(i => tags[i.sr] === 'shared')
  const sharedEach = shared.reduce((s, i) => s + i.amount, 0) / 2
  const myTotal = myItems.reduce((s, i) => s + i.amount, 0) + sharedEach
  const kalashTotal = kalashItems.reduce((s, i) => s + i.amount, 0) + sharedEach

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8faff 100%)', border: '1.5px solid #d1fae5' }}
      onClick={onTryNow}
    >
      {/* Label */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
        <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
          ▶ Live demo
        </span>
        <span className="text-xs text-gray-400 bg-white/80 px-2.5 py-1 rounded-full">
          Tap to try with your bill →
        </span>
      </div>

      <div className="pt-12 pb-4 px-4 min-h-[340px] flex flex-col">

        {/* Upload step */}
        {(step === 'upload' || step === 'parse') && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div
              className={`
                w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm
                transition-all duration-500
                ${uploading ? 'bg-white scale-110 shadow-md' : 'bg-white'}
              `}
              style={{ border: '1.5px solid #d1fae5' }}
            >
              <span className="text-3xl">📄</span>
              <span className="text-xs font-medium text-gray-500">invoice.pdf</span>
            </div>

            {uploading && (
              <div className="flex flex-col items-center gap-1 animate-pulse">
                <div className="w-1 h-6 bg-green-400 rounded-full" />
                <span className="text-xs text-green-600 font-medium">Uploading...</span>
              </div>
            )}

            {parsing && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">Reading invoice...</span>
              </div>
            )}
          </div>
        )}

        {/* Items + tagging step */}
        {['items', 'tag1', 'tag2', 'summary'].includes(step) && (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-600">Zepto — 12-07-2026</span>
              <span className="text-xs text-gray-400">₹277</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {DEMO_ITEMS.map(item => {
                const isVisible = visibleItems.some(v => v.sr === item.sr)
                const tag = tags[item.sr]
                const tagStyle = TAGS[tag]

                return (
                  <div
                    key={item.sr}
                    className={`
                      flex items-center justify-between rounded-xl px-3 py-2
                      transition-all duration-400
                      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}
                    style={{
                      background: tag === 'shared' ? 'white' : tag === 'mine' ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${tag === 'shared' ? '#e5e7eb' : tag === 'mine' ? '#bbf7d0' : '#fed7aa'}`,
                      transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">₹{item.amount}</p>
                    </div>
                    <span
                      className={`
                        text-xs font-semibold px-2.5 py-1 rounded-lg border
                        transition-all duration-300
                        ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}
                      `}
                    >
                      {tagStyle.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Live summary */}
            {showSummary && (
              <div
                className="mt-2 rounded-xl px-3 py-2.5 flex justify-around items-center animate-fade-in"
                style={{ background: 'white', border: '1px solid #d1fae5' }}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-400">You</p>
                  <p className="text-base font-bold text-gray-900">₹{Math.round(myTotal)}</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="text-center">
                  <p className="text-xs text-gray-400">Kalash</p>
                  <p className="text-base font-bold text-gray-900">₹{Math.round(kalashTotal)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className={`
                flex flex-col items-center gap-2 transition-all duration-500
                ${showDone ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              `}
            >
              <div className="text-4xl">✅</div>
              <p className="text-sm font-semibold text-gray-900">Logged to Splitwise</p>
              <div
                className="rounded-xl px-4 py-2.5 text-center"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <p className="text-xs text-gray-500">Kalash owes you</p>
                <p className="text-xl font-bold text-green-600">₹{Math.round(kalashTotal)}</p>
              </div>
              <p className="text-xs text-gray-400">30 seconds. No math. No Splitwise form.</p>
            </div>
          </div>
        )}

      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {['upload', 'items', 'tag1', 'summary', 'done'].map((s, i) => (
          <div
            key={s}
            className="rounded-full transition-all duration-300"
            style={{
              width: step === s ? 16 : 5,
              height: 5,
              background: step === s ? '#16a34a' : '#d1fae5',
            }}
          />
        ))}
      </div>
    </div>
  )
}
