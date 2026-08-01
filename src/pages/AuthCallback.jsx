import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiCall } from '../utils/api'

export default function AuthCallback({ saveUser }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code received')
      return
    }

    const exchangeCode = async () => {
      try {
        const data = await apiCall('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          skipAuth: true,
        })

        // Store token and user info
        localStorage.setItem('splitkaro_token', data.token)
        saveUser({ name: data.name, id: data.user_id })

        // Go to flatmate setup
        navigate('/setup')
      } catch (e) {
        setError(e.message)
      }
    }

    exchangeCode()
  }, [searchParams])

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Connection failed</h2>
        <p className="text-surface-500 mb-6">{error}</p>
        <button
          onClick={() => navigate('/setup')}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="animate-spin text-5xl mb-4">⏳</div>
      <p className="text-surface-800 font-medium">Connecting to Splitwise...</p>
    </div>
  )
}
