import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initializeDatabase, pool, redis } from './database';
import { planGenerator } from './plan-generator';
import { registerHistoryRoutes } from './history-routes';
import { registerMeasurementRoutes } from './measurement-routes';
import { registerAchievementRoutes } from './achievement-routes';
import { registerFeedbackRoutes } from './feedback-routes';
import { registerExportRoutes } from './export-routes';
import { registerBuddyRoutes } from './buddy-routes';
import { registerReportRoutes } from './report-routes';
import { registerGoalRoutes } from './goal-routes';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FitForge] 致命错误：JWT_SECRET 环境变量未设置。请在 .env 中设置 JWT_SECRET 后重启服务。');
  process.exit(1);
}
const secret: string = JWT_SECRET!;

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',').map(s => s.trim()).filter(Boolean);
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
app.use(cors({
  origin: isDev ? true : (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());
initializeDatabase().catch(console.error);

function logError(context: string, error: unknown): void {
  if (isDev) {
    console.error(`[FitForge] ${context}:`, error);
  } else {
    console.error(`[FitForge] ${context}:`, (error instanceof Error) ? error.message : 'unknown');
  }
}
interface AuthRequest extends Request { userId?: number; }

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: '未提供认证令牌' }); return; }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], secret) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch { res.status(401).json({ error: '认证令牌无效或已过期' }); }
}

function validate(schema: Record<string, string>, body: Record<string, unknown>): string | null {
  for (const [field, type] of Object.entries(schema)) {
    const val = body[field];
    if (val === undefined || val === null || val === '') return `缺少必填字段: ${field}`;
    if (type === 'number' && (typeof val !== 'number' || isNaN(val as number))) return `${field} 必须是数字`;
    if (type === 'string' && typeof val !== 'string') return `${field} 必须是字符串`;
    if (type === 'int' && (!Number.isInteger(val) || typeof val !== 'number')) return `${field} 必须是整数`;
  }
  return null;
}

// ── 根据反馈历史计算强度调整系数 ──
async function getFeedbackBias(userId: number): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT feedback FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date DESC LIMIT 5`,
      [userId],
    );
    const feedbacks = result.rows.map((r: any) => r.feedback);
    const tooEasy = feedbacks.filter((f: string) => f === '太简单').length;
    const tooHard = feedbacks.filter((f: string) => f === '太难').length;

    if (tooEasy >= 3) return 0.15;
    if (tooEasy >= 2) return 0.08;
    if (tooHard >= 3) return -0.15;
    if (tooHard >= 2) return -0.08;
    return 0;
  } catch { return 0; }
}


// ── 速率限制 ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 20,                   // 最多 20 次请求
  message: { error: '请求过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════ 认证路由 ═══════════════════

app.post('/api/auth/register', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const err = validate({ email: 'string', password: 'string' }, req.body);
    if (err) { res.status(400).json({ error: err }); return; }
    if (password.length < 8) { res.status(400).json({ error: '密码长度至少8位' }); return; }
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) { res.status(400).json({ error: '该邮箱已被注册' }); return; }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email', [email, hashedPassword],
    );
    res.status(201).json({ user: newUser.rows[0] });
  } catch (error) { res.status(500).json({ error: '服务器内部错误' }); }
});

app.post('/api/auth/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const err = validate({ email: 'string', password: 'string' }, req.body);
    if (err) { res.status(400).json({ error: err }); return; }
    const user = await pool.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) { res.status(401).json({ error: '邮箱或密码错误' }); return; }
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!isValidPassword) { res.status(401).json({ error: '邮箱或密码错误' }); return; }
    const token = jwt.sign({ userId: user.rows[0].id }, secret, { expiresIn: '24h' });
    res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email } });
  } catch (error) { res.status(500).json({ error: '服务器内部错误' }); }
});

// ═══════════════════ Dashboard ═══════════════════

app.get('/api/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const feedbacksResult = await pool.query(
      `SELECT workout_date, feedback FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date DESC LIMIT 365`, [userId],
    );
    const completedDates = new Set(feedbacksResult.rows.filter((r: any) => r.feedback === '完成' || r.feedback === '部分完成').map((r: any) => new Date(r.workout_date).toISOString().split('T')[0]));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (completedDates.has(d.toISOString().split('T')[0])) streak++;
      else if (i > 0) break;
    }
    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM workout_feedback WHERE user_id = $1 AND (feedback = '完成' OR feedback = '部分完成')`, [userId]);
    const totalWorkouts = parseInt(totalResult.rows[0].total, 10);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekResult = await pool.query(`SELECT COUNT(*) as count FROM workout_feedback WHERE user_id = $1 AND (feedback = '完成' OR feedback = '部分完成') AND workout_date >= $2`, [userId, weekStart.toISOString().split('T')[0]]);
    const weekWorkouts = parseInt(weekResult.rows[0].count, 10);
    const planResult = await pool.query(`SELECT *, start_date, end_date FROM workout_plans WHERE user_id = $1 AND end_date >= $2 ORDER BY created_at DESC LIMIT 1`, [userId, today.toISOString().split('T')[0]]);
    const profileResult = await pool.query(`SELECT * FROM user_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
    const todayResult = await pool.query(`SELECT * FROM workout_feedback WHERE user_id = $1 AND workout_date = $2`, [userId, today.toISOString().split('T')[0]]);

    let currentWeek = 0, todayWorkout = null;
    if (planResult.rows.length > 0) {
      const plan = planResult.rows[0];
      const planData = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
      const daysDiff = Math.floor((today.getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24));
      currentWeek = Math.max(1, Math.min(4, Math.floor(daysDiff / 7) + 1));
      const dayOfWeek = today.getDay() || 7;
      const week = planData.weeks?.find((w: any) => w.week === currentWeek);
      if (week) {
        const wd = week.workouts?.find((w: any) => w.day === dayOfWeek);
        if (wd) todayWorkout = { week: currentWeek, day: dayOfWeek, ...wd };
      }
    }

    // 反馈倾向
    const feedbackBias = await getFeedbackBias(userId);
    let suggestion = '';
    if (feedbackBias > 0.1) suggestion = '最近训练对你来说偏简单了，下次小铁帮你加点强度 💪';
    else if (feedbackBias < -0.1) suggestion = '最近训练好像有点吃力？适当降低强度没关系 🫂';

    res.json({
      streak, totalWorkouts, weekWorkouts,
      hasPlan: planResult.rows.length > 0,
      plan: planResult.rows.length > 0 ? { id: planResult.rows[0].id, startDate: planResult.rows[0].start_date, endDate: planResult.rows[0].end_date, currentWeek } : null,
      profile: profileResult.rows.length > 0 ? profileResult.rows[0] : null,
      todayCompleted: todayResult.rows.length > 0 && (todayResult.rows[0].feedback === '完成' || todayResult.rows[0].feedback === '部分完成'),
      todayWorkout, feedbackBias, suggestion,
    });
  } catch (error) { res.status(500).json({ error: '服务器内部错误' }); }
});

// ═══════════════════ 其他路由 ═══════════════════

app.get('/api/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
    if (user.rows.length === 0) { res.status(404).json({ error: '用户不存在' }); return; }
    res.json({ user: user.rows[0] });
  } catch (error) { res.status(500).json({ error: '服务器内部错误' }); }
});

app.post('/api/assessment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { cardioEndurance, muscleStrength, flexibility, balance } = req.body;
    const err = validate({ cardioEndurance: 'int', muscleStrength: 'int', flexibility: 'int', balance: 'int' }, req.body);
    if (err) { res.status(400).json({ error: err }); return; }
    for (const [k, v] of Object.entries({ cardioEndurance, muscleStrength, flexibility, balance })) {
      if ((v as number) < 1 || (v as number) > 10) { res.status(400).json({ error: `${k} 必须在 1-10 之间` }); return; }
    }
    const assessment = await pool.query(
      `INSERT INTO fitness_assessments (user_id, cardio_endurance, muscle_strength, flexibility, balance) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, cardioEndurance, muscleStrength, flexibility, balance],
    );
    await redis.set(`assessment:${req.userId}`, JSON.stringify(assessment.rows[0]));
    res.status(201).json({ assessment: assessment.rows[0] });
  } catch (error) { res.status(500).json({ error: '服务器内部错误' }); }
});

app.get('/api/assessment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const a = await pool.query('SELECT * FROM fitness_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.userId]);
    if (a.rows.length === 0) { res.status(404).json({ error: '请先完成体能评估' }); return; }
    res.json({ assessment: a.rows[0] });
  } catch { res.status(500).json({ error: '服务器内部错误' }); }
});

app.post('/api/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { age, gender, height, weight, weeklyWorkoutDays, workoutDuration, preferredWorkoutType, experienceLevel } = req.body;
    const err = validate({ age: 'int', gender: 'string', height: 'number', weight: 'number', weeklyWorkoutDays: 'int', workoutDuration: 'int', preferredWorkoutType: 'string', experienceLevel: 'string' }, req.body);
    if (err) { res.status(400).json({ error: err }); return; }
    if (!['male', 'female'].includes(gender)) { res.status(400).json({ error: '性别无效' }); return; }
    if (!['有氧', '力量', '柔韧', '混合'].includes(preferredWorkoutType)) { res.status(400).json({ error: '运动类型无效' }); return; }
    if (!['新手', '进阶', '高级'].includes(experienceLevel)) { res.status(400).json({ error: '经验等级无效' }); return; }

    const bmi = weight / Math.pow(height / 100, 2);
    const bmr = gender === 'male' ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age) : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [req.userId]);
    const profile = await pool.query(
      'INSERT INTO user_profiles (user_id, age, gender, height, weight, bmi, bmr, weekly_workout_days, workout_duration, preferred_workout_type, experience_level) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [req.userId, age, gender, height, weight, bmi, bmr, weeklyWorkoutDays, workoutDuration, preferredWorkoutType, experienceLevel],
    );
    res.status(201).json({ profile: profile.rows[0] });
  } catch (error) { logError('Profile error', error); res.status(500).json({ error: '服务器内部错误' }); }
});

app.get('/api/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const p = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.userId]);
    if (p.rows.length === 0) { res.status(404).json({ error: '请先完善用户画像' }); return; }
    res.json({ profile: p.rows[0] });
  } catch { res.status(500).json({ error: '服务器内部错误' }); }
});

// ── 计划生成（含反馈调整） ──
app.post('/api/plan/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const aResult = await pool.query('SELECT * FROM fitness_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.userId]);
    if (aResult.rows.length === 0) { res.status(400).json({ error: '请先完成体能评估' }); return; }
    const pResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.userId]);
    if (pResult.rows.length === 0) { res.status(400).json({ error: '请先完善用户画像' }); return; }

    const a = aResult.rows[0], p = pResult.rows[0];

    // 基于反馈历史调整强度
    const bias = await getFeedbackBias(req.userId!);
    const plan = planGenerator.generatePlan(
      { cardioEndurance: a.cardio_endurance, muscleStrength: a.muscle_strength, flexibility: a.flexibility, balance: a.balance },
      { age: p.age, gender: p.gender, height: p.height, weight: p.weight, bmi: p.bmi, bmr: p.bmr, weeklyWorkoutDays: p.weekly_workout_days, workoutDuration: p.workout_duration, preferredWorkoutType: p.preferred_workout_type, experienceLevel: p.experience_level },
      bias,
    );

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const savedPlan = await pool.query('INSERT INTO workout_plans (user_id, plan_data, start_date, end_date) VALUES ($1,$2,$3,$4) RETURNING *', [req.userId, JSON.stringify(plan), startDate, endDate]);
    res.status(201).json({ plan: savedPlan.rows[0], feedbackBias: bias });
  } catch (error) { logError('Plan generation error', error); res.status(500).json({ error: '服务器内部错误' }); }
});

app.get('/api/plan', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plans = await pool.query('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json({ plans: plans.rows });
  } catch { res.status(500).json({ error: '服务器内部错误' }); }
});

app.get('/api/plan/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await pool.query('SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (plan.rows.length === 0) { res.status(404).json({ error: '计划不存在' }); return; }
    res.json({ plan: plan.rows[0] });
  } catch { res.status(500).json({ error: '服务器内部错误' }); }
});



app.use('/api', apiLimiter);

registerMeasurementRoutes(app, authMiddleware);
registerAchievementRoutes(app, authMiddleware);
registerFeedbackRoutes(app, authMiddleware, validate);
registerExportRoutes(app, authMiddleware);
registerHistoryRoutes(app, authMiddleware);
registerReportRoutes(app, authMiddleware);
registerGoalRoutes(app, authMiddleware);
registerBuddyRoutes(app, authMiddleware);

app.get('/api/exercises', (_req: Request, res: Response) => {
  res.json({ exercises: planGenerator.getFullLibrary() });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'FitForge API is running!' });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
