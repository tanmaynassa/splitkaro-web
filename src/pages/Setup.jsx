import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../utils/api'

export default function Setup({ user, saveUser, saveFlatmates }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(user ? 'flatmates' : 'connect')
  const [searchQuery, setSearchQuery] = useState('')
  const [allFriends, setAllFriends] = useState([])
  const [selectedFlatmates, setSelectedFlatmates] = useState([])
  const [groups, setGroups] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [error, setError] = useState(null)

  // Check if redirected due to expired token
  const isReconnect = new URLSearchParams(window.location.search).get('reason') === 'reconnect'

  // Fetch all friends when entering flatmate step
  useEffect(() => {
    if (step === 'flatmates') {
      fetchAllFriends()
    }
  }, [step])

  const fetchAllFriends = async () => {
    setLoadingFriends(true)
    setError(null)
    try {
      const data = await apiCall('/api/friends')
      setAllFriends(data.friends || [])
    } catch (e) {
      if (e.message?.includes('401')) {
        // Token issue — redirect to reconnect
        localStorage.removeItem('splitkaro_token')
        localStorage.removeItem('splitkaro_user')
        navigate('/setup?reason=reconnect')
      } else {
        setError('Could not load friends. Check your connection and try again.')
      }
    } finally {
      setLoadingFriends(false)
    }
  }

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return allFriends
    const q = searchQuery.toLowerCase()
    return allFriends.filter(f => {
      const name = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase()
      return name.includes(q)
    })
  }, [searchQuery, allFriends])

  const connectSplitwise = async () => {
    try {
      const data = await apiCall('/api/auth/url', { skipAuth: true })
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleFriend = (friend) => {
    const exists = selectedFlatmates.find(f => f.splitwise_user_id === friend.id)
    if (exists) {
      setSelectedFlatmates(prev => prev.filter(f => f.splitwise_user_id !== friend.id))
    } else {
      const name = `${friend.first_name || ''} ${friend.last_name || ''}`.trim()
      setSelectedFlatmates(prev => [...prev, {
        splitwise_user_id: friend.id,
        name: name || 'Friend',
      }])
    }
    setSearchQuery('')
  }

  const removeFlatmate = (swId) => {
    setSelectedFlatmates(prev => prev.filter(f => f.splitwise_user_id !== swId))
  }

  const confirmFlatmates = async () => {
    if (selectedFlatmates.length === 0) {
      setError('Select at least one flatmate')
      return
    }

    setError(null)
    try {
      const data = await apiCall('/api/flatmates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flatmates: selectedFlatmates }),
      })

      saveFlatmates(selectedFlatmates)

      if (data.groups?.length > 0) {
        setGroups(data.groups)
        setStep('group')
      } else {
        navigate('/')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const selectGroup = async (groupId) => {
    try {
      await apiCall('/api/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      })
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={() => navigate('/')} className="text-surface-500 text-sm mb-6">← Back</button>

      {/* Step 1: Connect Splitwise */}
      {step === 'connect' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">
            {isReconnect ? 'Reconnect Splitwise' : 'Connect Splitwise'}
          </h2>
          {isReconnect && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              Your session expired. Tap below to reconnect — takes 10 seconds.
            </div>
          )}
          <p className="text-surface-600 mb-8">
            {isReconnect
              ? 'Your bill is saved. After reconnecting you can continue.'
              : 'One-time setup. We\'ll use Splitwise to log your shared expenses.'}
          </p>
          <button
            onClick={connectSplitwise}
            className="px-8 py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-base hover:bg-brand-700"
          >
            {isReconnect ? 'Reconnect Splitwise' : 'Connect Splitwise'}
          </button>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>
      )}

      {/* Step 2: Select flatmates */}
      {step === 'flatmates' && (
        <div>
          <h2 className="text-xl font-bold text-surface-900 mb-1">Who do you split with?</h2>
          <p className="text-sm text-surface-600 mb-6">Select from your Splitwise friends</p>

          {/* Selected flatmates chips */}
          {selectedFlatmates.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {selectedFlatmates.map(f => (
                  <button
                    key={f.splitwise_user_id}
                    onClick={() => removeFlatmate(f.splitwise_user_id)}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-all border border-brand-200"
                  >
                    {f.name.split(' ')[0]} ✕
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder={loadingFriends ? "Loading friends..." : "Type to search..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={loadingFriends}
              className="w-full px-4 py-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-surface-900 placeholder-surface-400"
            />
          </div>

          {error && (
            <div className="mb-4">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <button
                onClick={fetchAllFriends}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded-xl font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Friends list / dropdown */}
          {!loadingFriends && (
            <div className="space-y-1.5 mb-6 max-h-64 overflow-y-auto">
              {filteredFriends.length === 0 && searchQuery && (
                <p className="text-surface-500 text-sm py-3 text-center">
                  No friends match "{searchQuery}"
                </p>
              )}
              {filteredFriends.map(friend => {
                const name = `${friend.first_name || ''} ${friend.last_name || ''}`.trim()
                const isSelected = selectedFlatmates.some(f => f.splitwise_user_id === friend.id)
                return (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-surface-200 hover:border-brand-300'
                    }`}
                  >
                    <span className="font-medium text-surface-900">{name || 'Friend'}</span>
                    {isSelected && <span className="float-right text-brand-600">✓</span>}
                  </button>
                )
              })}
            </div>
          )}

          {loadingFriends && (
            <div className="text-center py-8">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              <p className="text-surface-500 text-sm">Loading your Splitwise friends...</p>
            </div>
          )}

          <button
            onClick={confirmFlatmates}
            disabled={selectedFlatmates.length === 0}
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold disabled:opacity-30"
          >
            Continue with {selectedFlatmates.length} flatmate{selectedFlatmates.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Step 3: Select group */}
      {step === 'group' && (
        <div>
          <h2 className="text-xl font-bold text-surface-900 mb-1">Add expenses to a group?</h2>
          <p className="text-sm text-surface-600 mb-6">
            Found these Splitwise groups with your flatmates
          </p>

          <div className="space-y-2 mb-4">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => selectGroup(g.id)}
                className="w-full text-left p-4 rounded-xl border border-surface-200 hover:border-brand-500 transition-all"
              >
                <span className="font-medium text-surface-900">{g.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => { selectGroup(null); }}
            className="w-full py-3 text-surface-500 text-sm"
          >
            Skip — add individually
          </button>
        </div>
      )}
    </div>
  )
}
