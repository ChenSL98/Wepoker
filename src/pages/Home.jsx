import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSessions, subscribeToSessions } from '../lib/supabase'

export default function Home() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const all = await fetchSessions()
      if (alive) setSessions(all.slice(0, 5))
    }
    load()
    const unsub = subscribeToSessions(load)
    return () => { alive = false; unsub() }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-purple-600 text-white px-5 py-8 rounded-b-3xl">
        <h1 className="text-2xl font-bold tracking-wide">欢乐豆计分器</h1>
        <p className="text-purple-200 text-sm mt-1">游戏积分，禁止赌博</p>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/create')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-800">创建牌局</div>
            <div className="text-xs text-gray-400 mt-0.5">发起新一局</div>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2" strokeLinecap="round">
                <polyline points="6,9 12,5 18,9"/><polyline points="6,17 6,13 18,13 18,17"/><line x1="4" y1="21" x2="20" y2="21"/>
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-800">排行榜</div>
            <div className="text-xs text-gray-400 mt-0.5">周月季年排行</div>
          </button>

          <button
            onClick={() => navigate('/players')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/>
                <path d="M3 21c0-3.5 3-6 6-6s6 2.5 6 6"/><path d="M11 21c0-3.5 3-6 6-6s6 2.5 6 6"/>
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-800">玩家管理</div>
            <div className="text-xs text-gray-400 mt-0.5">固定玩家库</div>
          </button>

        </div>
      </div>

      {/* Recent sessions */}
      <div className="px-5 mt-6 flex-1">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">最近牌局</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            还没有牌局记录，点击「创建牌局」开始吧
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const settled = s.status === 'settled'
              const winner = settled
                ? s.players?.reduce((a, b) => (a.net || 0) > (b.net || 0) ? a : b, s.players[0])
                : null
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/session/${s.code}`)}
                  className="bg-white rounded-xl p-4 border border-gray-100 active:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{s.name || '未命名牌局'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          settled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>{settled ? '已结算' : '进行中'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString('zh-CN')} · 每手{s.pointsPerHand}分 · {s.players?.length || 0}人
                      </div>
                    </div>
                    <div className="text-right">
                      {settled ? (
                        <>
                          <div className={`text-sm font-bold ${winner?.net > 0 ? 'text-red-500' : winner?.net < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {winner?.name || ''}
                          </div>
                          <div className="text-xs text-gray-400">{winner ? '赢' : ''}</div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">待结算</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-around safe-bottom">
        {[
          { label: '首页', path: '/', active: true },
          { label: '玩家', path: '/players' },
          { label: '排行', path: '/leaderboard' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center py-1 px-4 rounded-lg transition-colors ${
              item.active ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
