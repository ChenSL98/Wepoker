import { createClient } from '@supabase/supabase-js'
import { getMonday, computeWeekRanking, tierForRank, sameWeek } from './tiers'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 是否已接入云端（配置了 Supabase 密钥即为云端模式，否则用本地兜底）
export const isCloud = () => !!supabase

// ---------- 本地兜底存储 ----------
const LS_PLAYERS = 'texas_players'
const LS_SESSIONS = 'texas_sessions'
const LS_WEEKLY = 'texas_weekly_settlement'

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ---------- 行 <-> 对象 映射 ----------
function rowToPlayer(r) {
  return { id: r.id, name: r.name, tier: r.tier ?? null, createdAt: r.created_at }
}
function playerToRow(p) {
  return { id: p.id, name: p.name, tier: p.tier ?? null, created_at: p.createdAt || new Date().toISOString() }
}
function rowToSession(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    pointsPerHand: r.points_per_hand,
    status: r.status,
    players: r.players || [],
    createdAt: r.created_at,
    settledAt: r.settled_at || null
  }
}
function sessionToRow(s) {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    points_per_hand: s.pointsPerHand,
    status: s.status,
    players: s.players || [],
    created_at: s.createdAt || new Date().toISOString(),
    settled_at: s.settledAt || null
  }
}

// ---------- 玩家 ----------
export async function fetchPlayers() {
  if (supabase) {
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: true })
    if (error) { console.error(error); return [] }
    return (data || []).map(rowToPlayer)
  }
  return readJSON(LS_PLAYERS, [])
}

export async function savePlayer(player) {
  const row = playerToRow(player)
  if (supabase) {
    const { error } = await supabase.from('players').upsert(row, { onConflict: 'id' })
    if (error) console.error(error)
    return
  }
  const list = readJSON(LS_PLAYERS, [])
  const idx = list.findIndex(p => p.id === row.id)
  if (idx >= 0) list[idx] = rowToPlayer(row)
  else list.push(rowToPlayer(row))
  writeJSON(LS_PLAYERS, list)
}

export async function removePlayer(id) {
  if (supabase) {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) console.error(error)
    return
  }
  writeJSON(LS_PLAYERS, readJSON(LS_PLAYERS, []).filter(p => p.id !== id))
}

// ---------- 牌局 ----------
export async function fetchSessions() {
  if (supabase) {
    const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false })
    if (error) { console.error(error); return [] }
    return (data || []).map(rowToSession)
  }
  return readJSON(LS_SESSIONS, [])
}

export async function saveSession(session) {
  const row = sessionToRow(session)
  if (supabase) {
    const { error } = await supabase.from('sessions').upsert(row, { onConflict: 'id' })
    if (error) console.error(error)
    return
  }
  const list = readJSON(LS_SESSIONS, [])
  const idx = list.findIndex(s => s.id === row.id)
  const obj = rowToSession(row)
  if (idx >= 0) list[idx] = obj
  else list.unshift(obj)
  writeJSON(LS_SESSIONS, list)
}

export async function removeSession(id) {
  if (supabase) {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) console.error(error)
    return
  }
  writeJSON(LS_SESSIONS, readJSON(LS_SESSIONS, []).filter(s => s.id !== id))
}

// ---------- 周结算（段位） ----------
export async function getWeeklySettlementDate() {
  if (supabase) {
    const { data } = await supabase.from('meta').select('value').eq('key', 'lastWeeklySettlement').maybeSingle()
    return data?.value || ''
  }
  return localStorage.getItem(LS_WEEKLY) || ''
}
export async function setWeeklySettlementDate(iso) {
  if (supabase) {
    await supabase.from('meta').upsert({ key: 'lastWeeklySettlement', value: iso }, { onConflict: 'key' })
    return
  }
  localStorage.setItem(LS_WEEKLY, iso)
}

// 每周自动结算上一周段位（无服务器时由 App 启动时触发）
export async function runWeeklySettlement(referenceDate = new Date()) {
  const lastWeek = getMonday(referenceDate)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const last = await getWeeklySettlementDate()
  if (last && sameWeek(last, lastWeek)) return false

  const sessions = await fetchSessions()
  const ranked = computeWeekRanking(sessions, lastWeek)
  const players = await fetchPlayers()

  const tierByPlayer = {}
  ranked.forEach((p, idx) => {
    tierByPlayer[p.name] = tierForRank(idx + 1, ranked.length)
  })

  for (const pl of players) {
    const t = tierByPlayer[pl.name]
    if (t && t !== pl.tier) {
      await savePlayer({ ...pl, tier: t })
    }
  }
  await setWeeklySettlementDate(lastWeek.toISOString())
  return true
}

// ---------- 实时订阅 ----------
// 返回 unsubscribe 函数（本地模式返回空函数）
export function subscribeToSessions(callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('sessions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => callback())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
