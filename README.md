# 🏋️ FitForge — 智能健身计划系统

个性化健身训练计划生成与管理平台。基于用户体能评估和持续反馈，动态生成自适应训练方案。

## ✨ 功能模块

| 模块 | 说明 |
|------|------|
| 🧪 **体能评估** | 心肺、力量、柔韧性、平衡 4 维评分 |
| 📋 **训练计划** | 基于评估 + 用户画像，自动生成 4 周个性化计划 |
| ▶️ **训练执行器** | 分段计时（热身→主训练→拉伸），进度保持，断点续练 |
| 📝 **训练反馈** | 完成/太难/太简单/部分完成，驱动强度自适应 |
| 📊 **体测追踪** | 体重、腰围、胸围、臂围、腿围趋势记录 |
| 🎯 **目标管理** | 自定义健身目标，进度追踪，达成自动标记 |
| 🏆 **成就系统** | 12 项里程碑 + 5 级成长体系（新手→大师） |
| 🤖 **AI 训练搭伴** | 规则引擎 + LLM 双模式，上下文感知对话 |
| 📈 **周报生成** | 自动汇总每周训练数据 + AI 总结 |
| 📤 **数据导出** | 训练历史 / 体测数据 CSV/JSON 导出 |

## 🧠 核心设计

```
评估 → 计划生成 → 训练执行 → 反馈 → 强度自适应
                                          ↑
                              连续3次"太简单"→ 强度 +15%
                              连续3次"太难"   → 强度 -15%
```

不是静态的"万人一方"，而是根据你的真实反馈持续调整的个性化方案。

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + TypeScript + Vite + Tailwind CSS |
| 后端 | Express + TypeScript + JWT 鉴权 |
| 数据库 | PostgreSQL（生产）/ SQLite（本地） |
| 缓存 | Redis（生产）/ 内存缓存（本地） |

## 📁 项目结构

```
FitForge/
├── apps/
│   ├── api/             # Express 后端
│   │   ├── src/
│   │   │   ├── index.ts              # 入口 + 路由注册
│   │   │   ├── database.ts           # 数据库初始化（PG/SQLite 双模式）
│   │   │   ├── plan-generator.ts     # 计划生成引擎 + 动作库
│   │   │   ├── achievement-routes.ts # 成就系统
│   │   │   ├── buddy-routes.ts       # AI 训练搭伴
│   │   │   ├── feedback-routes.ts    # 训练反馈
│   │   │   ├── goal-routes.ts        # 目标管理
│   │   │   ├── history-routes.ts     # 训练历史 + 热力图
│   │   │   ├── measurement-routes.ts # 体测追踪
│   │   │   ├── report-routes.ts      # 周报生成
│   │   │   └── export-routes.ts      # 数据导出
│   │   └── dist/                     # 编译输出
│   └── web/             # React 前端
│       └── src/
│           ├── pages/
│           │   ├── Dashboard.tsx      # 首页仪表盘
│           │   ├── Assessment.tsx     # 体能评估
│           │   ├── Plan.tsx           # 训练计划
│           │   ├── WorkoutPlayer.tsx  # 训练执行器
│           │   ├── Feedback.tsx       # 训练反馈
│           │   ├── Achievements.tsx   # 成就系统
│           │   ├── Buddy.tsx          # AI 搭伴
│           │   ├── Goals.tsx          # 目标管理
│           │   ├── Measurements.tsx   # 体测追踪
│           │   ├── History.tsx        # 训练历史
│           │   ├── Report.tsx         # 周报
│           │   ├── Exercises.tsx      # 动作库
│           │   ├── Profile.tsx        # 用户画像
│           │   └── Settings.tsx       # 设置
│           └── components/
│               ├── Navbar.tsx
│               ├── AuthGuard.tsx
│               ├── Skeleton.tsx
│               └── InstallPrompt.tsx  # PWA 安装提示
└── Dockerfile           # Docker 构建配置
```

## 🚀 本地运行

### 前提条件
- Node.js >= 20
- npm

### 启动后端
```bash
cd apps/api
npm install
npm run build
node dist/index.js
```
默认使用 SQLite，无需额外配置。服务运行在 `http://localhost:3001`。

### 启动前端
```bash
cd apps/web
npm install
npm run dev
```
默认运行在 `http://localhost:5173`。

### 使用 PostgreSQL
```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export JWT_SECRET="your-secret-key"
node dist/index.js
```

## 📄 License

MIT
