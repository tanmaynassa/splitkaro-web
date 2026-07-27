import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Split from './pages/Split'
import Setup from './pages/Setup'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  const [user, setUser] = useState(null)
  const [flatmates, setFlatmates] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('splitkaro_user')
    const storedFm = localStorage.getItem('splitkaro_flatmates')
    if (stored) setUser(JSON.parse(stored))
    if (storedFm) setFlatmates(JSON.parse(storedFm))
  }, [])

  const saveUser = (u) => {
    setUser(u)
    localStorage.setItem('splitkaro_user', JSON.stringify(u))
  }

  const saveFlatmates = (fm) => {
    setFlatmates(fm)
    localStorage.setItem('splitkaro_flatmates', JSON.stringify(fm))
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={
            <Landing user={user} flatmates={flatmates} />
          } />
          <Route path="/split" element={
            <Split user={user} flatmates={flatmates} />
          } />
          <Route path="/setup" element={
            <Setup user={user} saveUser={saveUser} saveFlatmates={saveFlatmates} />
          } />
          <Route path="/auth/callback" element={
            <AuthCallback saveUser={saveUser} />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
