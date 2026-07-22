// 鱼类段位系统：7 档，按每周排行榜名次映射
// 前三：巨齿鲨 / 大白鲨 / 剑鱼；后三：河豚 / 小丑鱼 / 翻车鱼；中间：海鲈鱼

export const TIERS = {
  megalodon: { key: 'megalodon', name: '巨齿鲨', color: '#334155', desc: '每周第一' },
  greatwhite: { key: 'greatwhite', name: '大白鲨', color: '#64748b', desc: '每周第二' },
  swordfish: { key: 'swordfish', name: '剑鱼', color: '#378ADD', desc: '每周第三' },
  seabass: { key: 'seabass', name: '海鲈鱼', color: '#639922', desc: '中段玩家' },
  pufferfish: { key: 'pufferfish', name: '河豚', color: '#BA7517', desc: '每周倒数第三' },
  clownfish: { key: 'clownfish', name: '小丑鱼', color: '#D85A30', desc: '每周倒数第二' },
  sunfish: { key: 'sunfish', name: '翻车鱼', color: '#94a3b8', desc: '每周垫底' },
}

export const UNRANKED = { key: null, name: '未定级', color: '#cbd5e1', desc: '尚无战绩' }

export function getTier(key) {
  return TIERS[key] || UNRANKED
}

// 按名次 + 当周参赛人数映射段位
export function tierForRank(rank, totalCount) {
  if (rank === 1) return 'megalodon'
  if (rank === 2) return 'greatwhite'
  if (rank === 3) return 'swordfish'
  if (totalCount >= 7) {
    if (rank === totalCount) return 'sunfish'
    if (rank === totalCount - 1) return 'clownfish'
    if (rank === totalCount - 2) return 'pufferfish'
  }
  return 'seabass'
}

// 取某个日期所在周的周一（00:00）
export function getMonday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=周日
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d
}

function sameWeek(a, b) {
  return getMonday(a).getTime() === getMonday(b).getTime()
}

function formatWeekLabel(monday) {
  const d = new Date(monday)
  return `${d.getFullYear()} 第${Math.ceil(
    (d - new Date(d.getFullYear(), 0, 1)) / (7 * 24 * 3600 * 1000)
  )}周`
}

export { sameWeek, formatWeekLabel }

// 计算指定周区间（周一 ~ 下周一）的排行榜
export function computeWeekRanking(sessions, monday) {
  const start = new Date(monday)
  const end = new Date(monday)
  end.setDate(end.getDate() + 7)
  const stats = {}
  sessions
    .filter(s => s.status === 'settled')
    .forEach(s => {
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
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.net - a.net)
  return ranked
}
