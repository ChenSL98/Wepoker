import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPlayers, fetchSessions, saveSession as saveSessionCloud, savePlayer, removeSession, subscribeToSessions } from '../lib/supabase'
import FishAvatar from '../components/FishAvatar'

export default function Session() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [players, setPlayers] = useState([])
  const [showSettle, setShowSettle] = useState(false)
  const [remainingInputs, setRemainingInputs] = useState({})

  // 加入玩家弹窗
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addHands, setAddHands] = useState(1)
  // 下桌玩家弹窗（两步 + 二次确认）
  const [showRemove, setShowRemove] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removeRemaining, setRemoveRemaining] = useState('')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  // 结算后二次确认返回首页
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)
  // 重新结算二次确认
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  // 删除牌局
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    let alive = true
    let firstLoad = true
    const load = async () => {
      const [allSessions, allPlayers] = await Promise.all([fetchSessions(), fetchPlayers()])
      if (!alive) return
      setPlayers(allPlayers)
      const found = allSessions.find(s => s.code === code?.toUpperCase())
      if (found) {
        setSession(found)
        if (firstLoad) {
          const inputs = {}
          found.players.forEach(p => { inputs[p.name] = p.remaining || '' })
          setRemainingInputs(inputs)
          firstLoad = false
        }
      } else {
        setNotFound(true)
      }
    }
    load()
    // 轮询同步：即便未开启 realtime，多台手机也能保持数据一致
    const poll = setInterval(load, 4000)
    const unsub = subscribeToSessions(load)
    return () => { alive = false; clearInterval(poll); unsub() }
  }, [code])

  const saveSession = useCallback(async (updated) => {
    setSession(updated)
    await saveSessionCloud(updated)
  }, [])

  const changeHands = (playerName, delta) => {
    const updated = { ...session }
    const player = updated.players.find(p => p.name === playerName)
    if (player) {
      player.hands = Math.max(1, (player.hands || 1) + delta)
      player.remaining = player.remaining || 0
      saveSession(updated)
    }
  }

  const updateRemaining = (playerName, value) => {
    setRemainingInputs(prev => ({ ...prev, [playerName]: value }))
  }

  const settleSession = () => {
    const updated = { ...session }
    let allFilled = true
    updated.players.forEach(p => {
      if (p.left) return
      const val = parseInt(remainingInputs[p.name])
      if (isNaN(val) || val < 0) {
        allFilled = false
        return
      }
      p.remaining = val
      p.net = val - p.hands * updated.pointsPerHand
    })

    if (!allFilled) {
      alert('请为每位在桌玩家输入有效的剩余分数')
      return
    }

    updated.status = 'settled'
    updated.settledAt = new Date().toISOString()
    saveSession(updated)
    setShowSettle(false)
  }

  const resetSettle = () => {
    const updated = { ...session }
    updated.status = 'playing'
    updated.players.forEach(p => {
      p.remaining = 0
      p.net = null
      p.left = false
    })
    setRemainingInputs({})
    saveSession(updated)
  }

  const handleDelete = async () => {
    await removeSession(session.id)
    navigate('/')
  }

  const addPlayerToSession = async () => {
    const name = addName.trim()
    if (!name) {
      alert('请输入玩家姓名')
      return
    }
    if (session.players.some(p => p.name === name)) {
      alert('该玩家已在本局')
      return
    }
    const hands = Math.max(1, parseInt(addHands) || 1)
    const rosterPlayer = players.find(p => p.name === name)
    const updated = { ...session }
    updated.players = [...updated.players, {
      playerId: rosterPlayer?.id || '',
      name,
      hands,
      remaining: 0,
      net: null,
      left: false
    }]
    // 新人同时写入玩家库，便于长期统计
    if (!rosterPlayer) {
      await savePlayer({ id: Date.now().toString(), name, createdAt: new Date().toISOString() })
      setPlayers(await fetchPlayers())
    }
    await saveSession(updated)
    setShowAdd(false)
    setAddName('')
    setAddHands(1)
  }

  const confirmRemove = () => {
    const updated = { ...session }
    const p = updated.players.find(x => x.name === removeTarget?.name)
    if (p) {
      const rem = parseInt(removeRemaining) || 0
      p.remaining = rem
      p.net = rem - p.hands * updated.pointsPerHand
      p.left = true
    }
    saveSession(updated)
    setShowRemove(false)
    setShowRemoveConfirm(false)
    setRemoveTarget(null)
    setRemoveRemaining('')
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">牌局未找到</h2>
        <p className="text-sm text-gray-500 mb-6">该牌局不存在或已删除</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium">
          返回首页
        </button>
      </div>
    )
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">加载中...</div>
  }

  const isSettled = session.status === 'settled'
  const activePlayers = session.players.filter(p => !p.left)
  const sortedPlayers = [...session.players].sort((a, b) => (b.net || 0) - (a.net || 0))
  const winner = sortedPlayers[0]
  const available = players.filter(r => !session.players.some(p => p.name === r.name)).map(r => r.name)
  const tierOf = (name) => players.find(r => r.name === name)?.tier || null
  const previewNet = (removeRemaining === '' || isNaN(parseInt(removeRemaining)))
    ? null
    : parseInt(removeRemaining) - (removeTarget?.hands || 0) * session.pointsPerHand

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-purple-600 text-white px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-purple-200 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold">{session.name}</h1>
          <div className="text-xs text-purple-200">{isSettled ? '已结算' : '进行中'}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isSettled && (
            <>
              <button
                onClick={() => { setAddName(''); setAddHands(1); setShowAdd(true) }}
                className="w-9 h-9 rounded-full bg-white/20 text-white text-xl flex items-center justify-center active:bg-white/30"
              >＋</button>
              <button
                onClick={() => { setRemoveTarget(null); setRemoveRemaining(''); setShowRemove(true) }}
                className="w-9 h-9 rounded-full bg-white/20 text-white text-xl flex items-center justify-center active:bg-white/30"
              >－</button>
            </>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center active:bg-white/30"
            aria-label="删除牌局"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2 0 0 1-2,2H8a2,2 0 0 1-2-2L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4a1,1 0 0 1 1-1h4a1,1 0 0 1 1,1v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-purple-50 px-5 py-3 flex justify-between items-center border-b border-purple-100">
        <div>
          <div className="text-xs text-purple-500">每手</div>
          <div className="text-lg font-bold text-purple-800">{session.pointsPerHand} 分</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-purple-500">在桌</div>
          <div className="text-lg font-bold text-purple-800">{activePlayers.length} 人</div>
        </div>
      </div>

      {/* Player list / playing */}
      <div className="flex-1 px-5 py-3">
        {!isSettled && !showSettle && (
          <>
            <div className="text-xs text-gray-400 mb-3">
              每个人点 +/- 录入手数（Rebuy 就加一手）
            </div>
            <div className="space-y-2">
              {activePlayers.map((player) => {
                const totalBuy = player.hands * session.pointsPerHand
                return (
                  <div key={player.name} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FishAvatar tier={tierOf(player.name)} size={36} />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{player.name}</div>
                        <div className="text-xs text-gray-400">买入 {totalBuy} 分</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => changeHands(player.name, -1)}
                        disabled={player.hands <= 1}
                        className={`w-8 h-8 rounded-lg border text-lg flex items-center justify-center ${
                          player.hands <= 1
                            ? 'border-gray-100 text-gray-300'
                            : 'border-gray-200 text-gray-500 active:bg-gray-100'
                        }`}
                      >
                        -
                      </button>
                      <div className="text-center min-w-[36px]">
                        <div className="text-lg font-bold text-gray-800">{player.hands}</div>
                        <div className="text-xs text-gray-400">手</div>
                      </div>
                      <button
                        onClick={() => changeHands(player.name, 1)}
                        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 text-lg flex items-center justify-center active:bg-purple-50 active:border-purple-300 active:text-purple-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">
              中途可点右上角 ＋ / － 增减玩家
            </div>
          </>
        )}

        {/* Settlement input */}
        {showSettle && !isSettled && (
          <>
            <div className="text-xs text-gray-400 mb-3">输入每位在桌玩家结束时的剩余筹码积分</div>
            <div className="space-y-3">
              {activePlayers.map((player) => (
                <div key={player.name} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                    <span className="text-xs text-gray-400">{player.hands}手 · 买入{player.hands * session.pointsPerHand}分</span>
                  </div>
                  <input
                    type="number"
                    value={remainingInputs[player.name] || ''}
                    onChange={e => updateRemaining(player.name, e.target.value)}
                    placeholder="输入剩余筹码积分"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-gray-50"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Settled result */}
        {isSettled && (
          <>
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">🏆</div>
              <div className="text-sm text-gray-500">本局赢家</div>
              <div className="text-xl font-bold text-red-500">{winner?.name} {winner?.net > 0 ? '+' : ''}{winner?.net}</div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400 px-2 pb-1">
                <span>玩家</span><span>手数</span><span>买入</span><span>剩余</span><span className="w-16 text-right">净输赢</span>
              </div>
              {sortedPlayers.map((player, idx) => {
                const buy = player.hands * session.pointsPerHand
                return (
                  <div key={player.name} className={`flex items-center justify-between py-2.5 px-2 rounded-lg ${
                    player.left ? 'bg-gray-50' : idx === 0 ? 'bg-red-50' : player.net < 0 ? 'bg-green-50' : ''
                  }`}>
                    <div className="flex items-center gap-2 w-20">
                      <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
                      <FishAvatar tier={tierOf(player.name)} size={28} />
                      <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-center">{player.hands}手</span>
                    <span className="text-xs text-gray-500 w-10 text-center">{buy}</span>
                    <span className="text-xs text-gray-500 w-10 text-center">{player.remaining}</span>
                    <span className={`text-sm font-bold w-16 text-right ${
                      player.net > 0 ? 'text-red-500' : player.net < 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {player.net > 0 ? '+' : ''}{player.net}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">
              总买入 {sortedPlayers.reduce((s, p) => s + p.hands * session.pointsPerHand, 0)} 分
              = 总剩余 {sortedPlayers.reduce((s, p) => s + (p.remaining || 0), 0)} 分
              {sortedPlayers.reduce((s, p) => s + p.hands * session.pointsPerHand, 0) === sortedPlayers.reduce((s, p) => s + (p.remaining || 0), 0)
                ? ' ✓ 收支平衡'
                : ''
              }
            </div>
          </>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-5 py-4 bg-white border-t border-gray-100 safe-bottom">
        {isSettled ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-50"
            >
              重新结算
            </button>
            <button
              onClick={() => setShowFinalConfirm(true)}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold active:bg-purple-700"
            >
              确认结算
            </button>
          </div>
        ) : showSettle ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettle(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
            >
              返回
            </button>
            <button
              onClick={settleSession}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold active:bg-red-600"
            >
              确认结算
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSettle(true)}
            className="w-full py-3.5 bg-red-500 text-white rounded-xl text-base font-bold active:bg-red-600"
          >
            结束牌局 · 开始结算
          </button>
        )}
      </div>

      {/* 加入玩家弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">加入玩家</h3>
            <label className="text-xs text-gray-500 mb-1 block">玩家姓名</label>
            <input
              list="available-players"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="从库中选择或输入新名字"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-3 focus:outline-none focus:border-purple-400"
            />
            <datalist id="available-players">
              {available.map(n => <option key={n} value={n} />)}
            </datalist>
            <label className="text-xs text-gray-500 mb-1 block">已上手数</label>
            <input
              type="number"
              min="1"
              value={addHands}
              onChange={e => setAddHands(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-purple-400"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={addPlayerToSession} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium">加入牌局</button>
            </div>
          </div>
        </div>
      )}

      {/* 下桌玩家弹窗（两步） */}
      {showRemove && !showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRemove(false)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {!removeTarget ? (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">选择下桌玩家</h3>
                <div className="space-y-2">
                  {activePlayers.map(p => (
                    <button
                      key={p.name}
                      onClick={() => { setRemoveTarget(p); setRemoveRemaining('') }}
                      className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-100"
                    >{p.name}</button>
                  ))}
                </div>
                <button onClick={() => setShowRemove(false)} className="w-full mt-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-1">玩家下桌</h3>
                <p className="text-sm text-gray-500 mb-4">{removeTarget.name} · {removeTarget.hands}手 · 买入{removeTarget.hands * session.pointsPerHand}分</p>
                <label className="text-xs text-gray-500 mb-1 block">剩余筹码积分</label>
                <input
                  type="number"
                  value={removeRemaining}
                  onChange={e => setRemoveRemaining(e.target.value)}
                  placeholder="输入剩余筹码积分"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl mb-2 focus:outline-none focus:border-purple-400"
                />
                {previewNet !== null && (
                  <div className="text-sm mb-3">
                    净输赢：
                    <span className={previewNet > 0 ? 'text-red-500 font-bold' : previewNet < 0 ? 'text-green-600 font-bold' : 'text-gray-400 font-bold'}>
                      {previewNet > 0 ? '+' : ''}{previewNet}
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setRemoveTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">返回</button>
                  <button onClick={() => setShowRemoveConfirm(true)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium">确认下桌</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 下桌二次确认 */}
      {showRemoveConfirm && removeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">二次确认</h3>
            <p className="text-sm text-gray-500 mb-5">
              确认让「{removeTarget.name}」下桌？剩余 {removeRemaining} 分，净 {previewNet} 分。下桌后将从本局移除。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRemoveConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={confirmRemove} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium">确认下桌</button>
            </div>
          </div>
        </div>
      )}

      {/* 结算后二次确认返回首页 */}
      {showFinalConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认结算</h3>
            <p className="text-sm text-gray-500 mb-5">确认后本局将计入排行榜，并返回首页。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinalConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={() => navigate('/')} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 重新结算二次确认 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">重新结算</h3>
            <p className="text-sm text-gray-500 mb-5">
              确认要重新结算本局？所有结算结果（剩余分与净输赢）将被清空，本局重回「进行中」状态，且暂从排行榜移除。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              <button
                onClick={() => { setShowResetConfirm(false); resetSettle() }}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium"
              >确认重算</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除牌局二次确认 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">删除牌局</h3>
            <p className="text-sm text-gray-500 mb-5">
              确认删除「{session.name}」？删除后将从最近牌局移除{isSettled ? '，其战绩也会从排行榜消失' : ''}。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">取消</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
