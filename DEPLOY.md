# 欢乐豆计分器 · 部署与多人共享说明

目标：让全家人各自用手机（5G / WiFi 都行）打开同一个链接，看到同一份牌局数据、实时同步。

## 原理
- 前端（网页）部署到公网，得到一个链接。
- 数据存在 **Supabase 云端数据库**（免费），所有人打开链接读写的是同一份数据。
- 浏览器直连 Supabase，无需自建服务器。

## 你需要做的一步（约 2 分钟，免费）
1. 打开 https://supabase.com ，用邮箱注册并登录（免费版够用）。
2. 新建一个 Project（起个名字，如 `huanledou`）。
3. 进入 Project → **SQL Editor** → 新建查询 → 把本目录下的 `supabase_schema.sql` 全文粘贴进去 → 点 **Run**。
4. 进入 Project → **Project Settings** → **API**：
   - 复制 `Project URL`（形如 `https://xxxx.supabase.co`）
   - 复制 `anon public` 密钥（一长串）
5. 把这两串发给我（或填进 `.env` 文件）。

## 我来做（你给密钥后）
- 把密钥写入 `.env`，重新构建。
- 部署到公网（CloudStudio / Vercel），给你一个 `https://xxx` 链接。
- 全家人打开即用，5G 也能用，数据实时同步。

## 可选：自己部署到 Vercel
1. 把本项目推到 GitHub。
2. Vercel 导入该仓库，在 Environment Variables 里加：
   - `VITE_SUPABASE_URL` = 你的 Project URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon key
3. Deploy。得到 `xxx.vercel.app` 链接。

## 本地开发 / 测试
不配置密钥时，App 自动使用浏览器本地存储（localStorage），可在电脑 `localhost:5173` 单独测试界面与逻辑，但各设备数据不共享。
