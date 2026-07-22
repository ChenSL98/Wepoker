import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlayers, savePlayer, removePlayer, fetchSessions } from '../lib/supabase'
import { getTier } from '../lib/tiers'
import FishAvatar from '../components/FishAvatar'

export default function Players() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [newName, setNewName] = useState('')
  const [showDelete, setShowDelete] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    fetchPlayers().then(setPlayers)
    fetchSessions().then(setSessions)
  }, [])

  const addPlayer = async () => {
    const name = newName.trim()
    if (!name) return
    if (players.find(p => p.name === name)) {
      alert('该玩家已存在')
      return
    }
    const player = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      tier: null,
    }
    await savePlayer(player)
    setPlayers(await fetchPlayers())
    setNewName('')
  }

  const deletePlayer = async (id) => {
    await removePlayer(id)
    setPlayers(await fetchPlayers())
    setShowDelete(null)
  }



  const getPlayerStats = (playerName) => {
    const playerSessions = sessions.filter(s =>
      s.status === 'settled' && s.players?.some(p => p.name === playerName && p.net !== undefined)
    )
    const totalNet = playerSessions.reduce((sum, s) => {
      const p = s.players.find(x => x.name === playerName)
      return sum + (p?.net || 0)
    }, 0)
    return { sessions: playerSessions.length, totalNet }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const sa = getPlayerStats(a.name)
    const sb = getPlayerStats(b.name)
    return sb.totalNet - sa.totalNet
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">玩家管理</h1>
        <span className="text-sm text-gray-400 ml-auto">{players.length} 人</span>
      </div>

      {/* Add player */}
      <div className="px-5 py-3 bg-white border-b border-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlayer()}
            placeholder="输入玩家姓名"
            className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={addPlayer}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm rounded-lg font-medium active:bg-purple-700"
          >
            添加
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 px-5 py-2">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            还没有玩家，请先添加家庭成员
          </div>
        ) : (
          <div className="space-y-1">
            {sortedPlayers.map((player, idx) => {
              const stats = getPlayerStats(player.name)
              const tier = getTier(player.tier)
              return (
                <div
                  key={player.id}
                  onClick={() => setDetail(player)}
                  className="flex items-center justify-between py-3 border-b border-gray-50 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FishAvatar tier={player.tier} size={38} />
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
                      <div className="text-xs text-gray-400">
                        {stats.sessions > 0
                          ? `${stats.sessions}局 · 总${stats.totalNet >= 0 ? '盈利' : '亏损'} `
                          : '暂无记录'}
                        <span className={stats.totalNet > 0 ? 'text-red-500 font-medium' : stats.totalNet < 0 ? 'text-green-600 font-medium' : ''}>
                          {stats.totalNet > 0 ? '+' : ''}{stats.totalNet || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDelete(player.id) }}
                    className="text-gray-300 hover:text-red-400 p-2"
                    aria-label="删除玩家"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDelete(null)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-5">
              删除玩家「{players.find(p => p.id === showDelete)?.name}」？历史牌局数据会保留。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">
                取消
              </button>
              <button onClick={() => deletePlayer(showDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player detail panel */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-3">
              <FishAvatar tier={detail.tier} size={80} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{detail.name}</h3>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium text-white mt-1"
              style={{ backgroundColor: getTier(detail.tier).color }}
            >
              {getTier(detail.tier).name}
            </span>
            {(() => {
              const st = getPlayerStats(detail.name)
              return (
                <div className="flex justify-around mt-5">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{st.sessions}</div>
                    <div className="text-xs text-gray-400">参局数</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${st.totalNet > 0 ? 'text-red-500' : st.totalNet < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {st.totalNet > 0 ? '+' : ''}{st.totalNet}
                    </div>
                    <div className="text-xs text-gray-400">累计净输赢</div>
                  </div>
                </div>
              )
            })()}
            <button
              onClick={() => setDetail(null)}
              className="w-full mt-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
