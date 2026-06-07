# FitForge 部署指南

## 架构

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│  Vercel  │────▶│ Railway  │────▶│  Supabase  │
│ (前端)    │     │ (后端API) │     │ (PostgreSQL)│
│ React SPA│     │ Express  │     │            │
└──────────┘     └──────────┘     └───────────┘
```

---

## 第一步：Supabase 数据库

1. 打开 [supabase.com](https://supabase.com) 注册/登录
2. 新建项目，记住数据库密码
3. 进入 **Settings → Database → Connection string**
4. 复制 **URI** 格式的连接串，替换密码：
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres
   ```
5. 自动建表：后端启动时会自动创建所有表（users, fitness_assessments, user_profiles, workout_plans, workout_feedback, body_measurements, fitness_goals）

---

## 第二步：Railway 部署后端

1. 打开 [railway.app](https://railway.app) 注册/登录
2. 新建项目 → **Deploy from GitHub repo** → 选择你的 FitForge 仓库
3. 项目会自动读取 `railway.json` 配置
4. 进入 **Variables** 添加环境变量：

| 变量 | 值 |
|------|-----|
| `DATABASE_URL` | Supabase 连接串（上一步复制的） |
| `JWT_SECRET` | 随机长字符串（`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`） |
| `CORS_ORIGINS` | Vercel 域名（第三步拿到后回来填） |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

5. Railway 自动部署，记下分配给你的域名（如 `fitforge-api.up.railway.app`）

---

## 第三步：Vercel 部署前端

1. 打开 [vercel.com](https://vercel.com) 注册/登录
2. **Add New → Project** → 选择你的 FitForge 仓库
3. 配置：
   - **Framework**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 添加环境变量：

| 变量 | 值 |
|------|-----|
| `VITE_API_URL` | `https://你的Railway域名` （如 `https://fitforge-api.up.railway.app`） |

5. 点击 Deploy，记下 Vercel 分配的域名（如 `fitforge.vercel.app`）

---

## 第四步：回填 CORS

回到 Railway → Variables，更新 `CORS_ORIGINS` 为：

```
CORS_ORIGINS=https://你的Vercel域名.vercel.app
```

触发重新部署即可。

---

## 本地开发

```bash
# 终端 1：启动 API
cd apps/api
npm install
npm run dev          # → http://localhost:3001

# 终端 2：启动前端
cd apps/web
npm install
npm run dev          # → http://localhost:5173
```

本地默认使用 SQLite，无需配置数据库。要连接 Supabase 测试，在 `apps/api/.env` 中设置 `DATABASE_URL`。
