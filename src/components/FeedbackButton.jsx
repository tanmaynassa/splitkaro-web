import { useState } from 'react'

// Replace these with your actual EmailJS values after signing up
const EMAILJS_SERVICE_ID = 'service_2i25v0f'
const EMAILJS_TEMPLATE_ID = 'template_ly13v8p'
const EMAILJS_PUBLIC_KEY = 'EHgnsyv076-1wkO9X'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const sendFeedback = async () => {
    if (!message.trim()) {
      setError('Please write something first')
      return
    }

    setSending(true)
    setError(null)

    try {
      // Load EmailJS dynamically
      const emailjs = await import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js')
        .catch(() => window.emailjs)

      // If dynamic import failed, use window.emailjs (loaded via script tag)
      const ejs = window.emailjs

      await ejs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: email ? email.split('@')[0] : 'SplitKaro User',
          from_email: email || 'anonymous@splitkaro.app',
          message: message,
          to_email: 'tanmay.nassa.work@gmail.com',
        },
        EMAILJS_PUBLIC_KEY
      )

      setSent(true)
      setMessage('')
      setEmail('')
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 2000)

    } catch (e) {
      setError('Failed to send. Try again.')
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 px-4 py-2 bg-white border border-surface-200 rounded-full shadow-md text-sm font-medium text-surface-700 hover:shadow-lg transition-all flex items-center gap-2"
        style={{ zIndex: 40 }}
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">

            {sent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🙏</div>
                <p className="font-semibold text-surface-900">Thanks for the feedback!</p>
                <p className="text-sm text-surface-500 mt-1">It really helps.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-surface-900 text-lg">Share feedback</h3>
                    <p className="text-sm text-surface-500">What's working? What's missing? What broke?</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-surface-400 text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write anything — bugs, ideas, confusing bits, what you wish it did..."
                  rows={4}
                  className="w-full px-4 py-3 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:border-brand-500 resize-none mb-3"
                  autoFocus
                />

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email (optional — if you want a reply)"
                  className="w-full px-4 py-3 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:border-brand-500 mb-4"
                />

                {error && (
                  <p className="text-red-600 text-sm mb-3">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={sendFeedback}
                    disabled={sending || !message.trim()}
                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-brand-700 transition-all"
                  >
                    {sending ? 'Sending...' : 'Send feedback'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 bg-surface-100 text-surface-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
