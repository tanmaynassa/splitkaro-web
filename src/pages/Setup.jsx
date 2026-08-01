import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../utils/api'

export default function Setup({ user, saveUser, saveFlatmates }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(user ? 'flatmates' : 'connect')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFlatmates, setSelectedFlatmates] = useState([])
  const [groups, setGroups] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)

  const connectSplitwise = async () => {
    try {
      const data = await apiCall('/api/auth/url')
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
    }
  }

  const searchFriends = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)
    try {
      const data = await apiCall(`/api/friends?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(data.friends || [])
      if (data.friends?.length === 0) {
        setError('No friends found with that name. Make sure they\'re added on Splitwise.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSearching(false)
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

      // Check for groups
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
      <button onClick={() => navigate('/')} className="text-surface-200 text-sm mb-6">← Back</button>

      {/* Step 1: Connect Splitwise */}
      {step === 'connect' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Connect Splitwise</h2>
          <p className="text-surface-200 mb-8">
            One-time setup. We'll use Splitwise to log your shared expenses.
          </p>
          <button
            onClick={connectSplitwise}
            className="px-8 py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-base hover:bg-brand-700"
          >
            Connect Splitwise
          </button>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>
      )}

      {/* Step 2: Select flatmates */}
      {step === 'flatmates' && (
        <div>
          <h2 className="text-xl font-bold text-surface-900 mb-1">Who do you split with?</h2>
          <p className="text-sm text-surface-200 mb-6">Search your Splitwise friends</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Type a name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchFriends()}
              className="flex-1 px-4 py-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={searchFriends}
              disabled={searching}
              className="px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium"
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 mb-6">
              {searchResults.map(friend => {
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
                    <span className="font-medium text-surface-900">{name}</span>
                    {isSelected && <span className="float-right text-brand-600">✓</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Selected flatmates */}
          {selectedFlatmates.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-surface-800 mb-2">Selected:</p>
              <div className="flex gap-2 flex-wrap">
                {selectedFlatmates.map(f => (
                  <button
                    key={f.splitwise_user_id}
                    onClick={() => removeFlatmate(f.splitwise_user_id)}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    {f.name.split(' ')[0]} ✕
                  </button>
                ))}
              </div>
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
          <p className="text-sm text-surface-200 mb-6">
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
            className="w-full py-3 text-surface-200 text-sm"
          >
            Skip — add individually
          </button>
        </div>
      )}
    </div>
  )
}
