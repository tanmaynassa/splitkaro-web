import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF, isLoggedIn } from '../utils/api'

export default function Landing({ user, flatmates }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const navigate = useNavigate()

  const handleFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF invoice')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const parsed = await uploadPDF(file)
      // Store parsed data and navigate to split page
      sessionStorage.setItem('splitkaro_parsed', JSON.stringify(parsed))
      navigate('/split')
    } catch (e) {
      setError(e.message || 'Failed to parse invoice. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const onFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-surface-900">
          🛒 Split<span className="text-brand-600">Karo</span>
        </h1>
        <p className="text-surface-500 mt-1 text-sm tracking-wide">
          grocery bills → splitwise, in 30 seconds
        </p>
      </div>

      {/* Status bar */}
      {user && flatmates.length > 0 && (
        <div className="mb-6 p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-700 font-medium">
              ✅ Connected as {user.name}
            </p>
            <p className="text-xs text-brand-600">
              Splitting with {flatmates.map(f => f.name.split(' ')[0]).join(', ')}
            </p>
          </div>
          <a href="/setup" className="text-xs text-brand-600 underline">Change</a>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${dragging 
            ? 'border-brand-500 bg-brand-50 scale-[1.02]' 
            : 'border-surface-200 hover:border-brand-500 hover:bg-brand-50'
          }
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onFileSelect}
        />
        
        {loading ? (
          <>
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-surface-800 font-medium">Parsing invoice...</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-surface-800 font-semibold text-lg">
              Upload grocery invoice
            </p>
            <p className="text-surface-500 text-sm mt-2">
              Tap here or drag & drop your PDF
            </p>
            <p className="text-surface-500 text-xs mt-4">
              Works with Zepto & Swiggy Instamart
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* How it works — only show if not set up */}
      {!user && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">How it works</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <div>
                <p className="font-medium text-surface-800">Upload the invoice PDF</p>
                <p className="text-sm text-surface-500">Download from Zepto or Instamart app, upload here</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <div>
                <p className="font-medium text-surface-800">Tap to tag items</p>
                <p className="text-sm text-surface-500">Tap each item to mark it as yours, a flatmate's, or shared</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <div>
                <p className="font-medium text-surface-800">Confirm — done</p>
                <p className="text-sm text-surface-500">Split is calculated and logged to Splitwise automatically</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-surface-500">Free forever. No account needed to try.</p>
          </div>
        </div>
      )}
    </div>
  )
}
