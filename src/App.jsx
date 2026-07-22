import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Players from './pages/Players'
import CreateSession from './pages/CreateSession'
import Session from './pages/Session'
import Leaderboard from './pages/Leaderboard'
import { runWeeklySettlement } from './lib/supabase'

export default function App() {
  useEffect(() => {
    // 每次启动检查：若上周尚未结算，则按上周战况自动定段位
    runWeeklySettlement().catch(err => console.error('周结算失败', err))
  }, [])

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/create" element={<CreateSession />} />
        <Route path="/session/:code" element={<Session />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  )
}
