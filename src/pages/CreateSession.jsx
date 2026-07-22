import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlayers, saveSession } from '../lib/supabase'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function CreateSession() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [pointsPerHand, setPointsPerHand] = useState(500)
  const [selected, setSelected] = useState([])
  const [sessionName, setSessionName] = useState('')

  useEffect(() => {
    fetchPlayers().then(setPlayers)
  }, [])

  const togglePlayer = (name) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const adjustPoints = (dir) => {
    setPointsPerHand(prev => Math.max(500, prev + dir * 500))
  }

  const startSession = async () => {
    if (selected.length < 2) return
    const code = generateCode()
    const session = {
      id: Date.now().toString(),
      code,
      name: sessionName.trim() || `${new Date().toLocaleDateString('zh-CN')} 牌局`,
      pointsPerHand,
      status: 'playing',
      players: selected.map(name => ({
        playerId: players.find(p => p.name === name)?.id || '',
        name,
        hands: 1,
        remaining: 0,
        net: null,
        left: false
      })),
      createdAt: new Date().toISOString()
    }
    await saveSession(session)
    navigate(`/session/${code}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">创建牌局</h1>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Points per hand */}
        <div className="bg-purple-50 rounded-2xl p-4">
          <div className="text-xs text-purple-500 mb-2 font-medium">每手分数</div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustPoints(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-purple-600 text-xl flex items-center justify-center active:bg-purple-100"
            >
              -
            </button>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">{pointsPerHand}</span>
              <span className="text-sm text-purple-500 ml-1">分/手</span>
            </div>
            <button
              onClick={() => adjustPoints(1)}
              className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-purple-600 text-xl flex items-center justify-center active:bg-purple-100"
            >
              +
            </button>
          </div>
        </div>

        {/* Session name */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">牌局名称（可选）</label>
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="如：周五家庭局"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Player selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 font-medium">选择参局玩家</label>
            <span className="text-xs text-purple-500 font-medium">{selected.length} 人已选</span>
          </div>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              还没有玩家，请先去「玩家管理」添加
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map(player => {
                const isSel = selected.includes(player.name)
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.name)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      isSel
                        ? 'bg-purple-600 text-white border-2 border-purple-600'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    {isSel ? '✓ ' : ''}{player.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start button */}
      <div className="px-5 py-4 safe-bottom">
        <button
          onClick={startSession}
          disabled={selected.length < 2}
          className={`w-full py-3.5 rounded-xl text-base font-bold transition-all ${
            selected.length >= 2
              ? 'bg-purple-600 text-white active:bg-purple-700'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {selected.length < 2 ? '请至少选择 2 位玩家' : `开始牌局 (${selected.length}人)`}
        </button>
      </div>
    </div>
  )
}
