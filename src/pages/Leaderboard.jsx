import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSessions, fetchPlayers } from '../lib/supabase'
import { getMonday, getTier } from '../lib/tiers'
import FishAvatar from '../components/FishAvatar'

const PERIODS = ['week', 'month', 'quarter', 'year']
const PERIOD_LABELS = { week: '周', month: '月', quarter: '季', year: '年' }

function getPeriodStartFor(period, offset) {
  const now = new Date()
  if (period === 'week') {
    const d = getMonday(now)
    d.setDate(d.getDate() - offset * 7)
    return d
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth() - offset, 1)
  }
  if (period === 'quarter') {
    const m = now.getMonth() - offset * 3
    return new Date(now.getFullYear(), m - (m % 3), 1)
  }
  return new Date(now.getFullYear() - offset, 0, 1)
}

function getPeriodEnd(period, start) {
  const e = new Date(start)
  if (period === 'week') e.setDate(e.getDate() + 7)
  else if (period === 'month') e.setMonth(e.getMonth() + 1)
  else if (period === 'quarter') e.setMonth(e.getMonth() + 3)
  else e.setFullYear(e.getFullYear() + 1)
  return e
}

function getWeekNum(d) {
  const first = new Date(d.getFullYear(), 0, 1)
  const monday = getMonday(d)
  return Math.round((monday - first) / (7 * 24 * 3600 * 1000)) + 1
}

function periodLabel(period, offset) {
  const start = getPeriodStartFor(period, offset)
  if (period === 'week') return `${start.getFullYear()} 第${getWeekNum(start)}周`
  if (period === 'month') return `${start.getFullYear()}年${start.getMonth() + 1}月`
  if (period === 'quarter') return `${start.getFullYear()} Q${Math.floor(start.getMonth() / 3) + 1}`
  return `${start.getFullYear()}年`
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [offset, setOffset] = useState(0)
  const [rankings, setRankings] = useState([])

  useEffect(() => {
    let alive = true
    const run = async () => {
      const [sessions, roster] = await Promise.all([fetchSessions(), fetchPlayers()])
      if (!alive) return
      const tierMap = {}
      roster.forEach(p => { tierMap[p.name] = p.tier || null })

      const start = getPeriodStartFor(period, offset)
      const end = getPeriodEnd(period, start)
      const stats = {}

      sessions.filter(s => s.status === 'settled').forEach(s => {
        const t = new Date(s.createdAt)
        if (t < start || t >= end) return
        s.players?.forEach(p => {
          if (p.net === null || p.net === undefined) return
          if (!stats[p.name]) stats[p.name] = { net: 0, sessions: 0 }
          stats[p.name].net += p.net
          stats[p.name].sessions += 1
        })
      })

      const ranked = Object.entries(stats)
        .map(([name, data]) => ({ name, tier: tierMap[name], ...data }))
        .sort((a, b) => b.net - a.net)

      setRankings(ranked)
    }
    run()
    return () => { alive = false }
  }, [period, offset])

  const changeOffset = (delta) => {
    setOffset(prev => Math.max(0, prev + delta))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">排行榜</h1>
      </div>

      {/* Period tabs */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setOffset(0) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* History navigation */}
      <div className="px-5 pb-2 flex items-center justify-between">
        <button
          onClick={() => changeOffset(1)}
          className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center active:bg-gray-200"
          aria-label="上一周期"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-800">{periodLabel(period, offset)}</div>
          <div className="text-[10px] text-gray-400">{offset === 0 ? '当前' : '历史'}</div>
        </div>
        <button
          onClick={() => changeOffset(-1)}
          disabled={offset === 0}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            offset === 0 ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-500 active:bg-gray-200'
          }`}
          aria-label="下一周期"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>

      {/* Rankings */}
      <div className="flex-1 px-5 py-2">
        {rankings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {periodLabel(period, offset)}还没有牌局记录
          </div>
        ) : (
          <div className="space-y-1">
            {rankings.map((player, idx) => {
              const tier = getTier(player.tier)
              return (
                <div
                  key={player.name}
                  className={`flex items-center justify-between py-3 px-3 rounded-xl ${
                    idx === 0 ? 'bg-amber-50' :
                    idx === 1 ? 'bg-gray-50' :
                    idx === 2 ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <FishAvatar tier={player.tier} size={36} />
                    <div>
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        {player.name}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                          style={{ backgroundColor: tier.color }}
                        >
                          {tier.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{player.sessions} 局</div>
                    </div>
                  </div>
                  <div className={`text-base font-bold ${
                    player.net > 0 ? 'text-red-500' :
                    player.net < 0 ? 'text-green-600' :
                    'text-gray-400'
                  }`}>
                    {player.net > 0 ? '+' : ''}{player.net}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
