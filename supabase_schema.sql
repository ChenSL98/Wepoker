-- 欢乐豆计分器 Supabase 数据库建表 SQL
-- 在 Supabase 控制台 → SQL Editor 中粘贴执行
-- 说明：自家人娱乐局，无需登录，采用宽松 RLS（允许匿名读写）。
--       若担心外泄，可日后改为带密码的访问。

-- 玩家花名册（长期保留，含段位 tier）
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT,                       -- 段位 key：meg/white/sword/seabass/puffer/clown/sunfish，null=未定级
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 牌局（players 以 JSONB 内嵌，简化实时同步）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  points_per_hand INTEGER NOT NULL DEFAULT 500,
  status TEXT DEFAULT 'playing' CHECK (status IN ('playing', 'settled')),
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- 元信息（如周结算日期）
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);

-- 宽松 RLS：允许匿名完全访问（家庭娱乐局，自家人使用）
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meta" ON meta FOR ALL USING (true) WITH CHECK (true);

-- 开启实时订阅（多手机同步）
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
