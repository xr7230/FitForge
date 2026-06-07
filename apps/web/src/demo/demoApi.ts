// Demo mode: mock API responses for GitHub Pages static demo
// Stores state in localStorage for persistence across refreshes

const DEMO_TOKEN = "demo-token-xxx";
const DEMO_USER = { id: 1, email: "demo@fitforge.app" };

interface DemoState {
  assessments: any[];
  profile: any | null;
  plans: any[];
  feedbacks: any[];
  measurements: any[];
  goals: any[];
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem("fitforge_demo_state");
    return raw ? JSON.parse(raw) : { assessments: [], profile: null, plans: [], feedbacks: [], measurements: [], goals: [] };
  } catch {
    return { assessments: [], profile: null, plans: [], feedbacks: [], measurements: [], goals: [] };
  }
}

function saveState(s: DemoState) {
  localStorage.setItem("fitforge_demo_state", JSON.stringify(s));
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function handleDemoRequest(url: string, options?: RequestInit): Promise<Response> {
  const path = url.replace(/^.*\/api/, "/api");
  const method = (options?.method || "GET").toUpperCase();
  const body = options?.body ? JSON.parse(options.body as string) : {};
  const state = loadState();

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  // ── Auth ──
  if (path === "/api/auth/register" && method === "POST") {
    return json({ user: DEMO_USER });
  }
  if (path === "/api/auth/login" && method === "POST") {
    return json({ token: DEMO_TOKEN, user: DEMO_USER });
  }

  // ── Dashboard ──
  if (path === "/api/dashboard") {
    const completed = state.feedbacks.filter((f: any) => f.feedback === "完成" || f.feedback === "部分完成");
    const streak = calcStreak(state);
    const plan = state.plans.length > 0 ? state.plans[0] : null;
    let currentWeek = 1, todayWorkout = null;
    if (plan) {
      const daysSinceStart = Math.floor((Date.now() - new Date(plan.start_date).getTime()) / 86400000);
      currentWeek = Math.max(1, Math.min(4, Math.floor(daysSinceStart / 7) + 1));
      const dow = new Date().getDay() || 7;
      const planData = typeof plan.plan_data === "string" ? JSON.parse(plan.plan_data) : plan.plan_data;
      const week = planData.weeks?.find((w: any) => w.week === currentWeek);
      if (week) {
        const wd = week.workouts?.find((w: any) => w.day === dow);
        if (wd) todayWorkout = { week: currentWeek, day: dow, ...wd };
      }
    }
    const todayCompleted = state.feedbacks.some((f: any) => f.workout_date === today() && (f.feedback === "完成" || f.feedback === "部分完成"));
    return json({
      streak, totalWorkouts: completed.length, weekWorkouts: completed.filter((f: any) => f.workout_date >= daysAgo(7)).length,
      hasPlan: state.plans.length > 0,
      plan: plan ? { id: plan.id, startDate: plan.start_date, endDate: plan.end_date, currentWeek } : null,
      profile: state.profile, todayCompleted, todayWorkout, feedbackBias: 0, suggestion: "",
    });
  }

  // ── Assessment ──
  if (path === "/api/assessment" && method === "GET") {
    if (state.assessments.length === 0) return json({ assessments: [] });
    return json({ assessment: state.assessments[state.assessments.length - 1] });
  }
  if (path === "/api/assessment" && method === "POST") {
    const a = {
      id: Date.now(), user_id: 1,
      cardio_endurance: body.cardioEndurance, muscle_strength: body.muscleStrength,
      flexibility: body.flexibility, balance: body.balance,
      created_at: today(),
    };
    state.assessments.push(a);
    saveState(state);
    return json({ assessment: a }, 201);
  }

  // ── Profile ──
  if (path === "/api/profile" && method === "GET") {
    return json({ profile: state.profile });
  }
  if (path === "/api/profile" && method === "POST") {
    const bmi = body.weight / Math.pow(body.height / 100, 2);
    const bmr = body.gender === "male"
      ? 88.362 + 13.397 * body.weight + 4.799 * body.height - 5.677 * body.age
      : 447.593 + 9.247 * body.weight + 3.098 * body.height - 4.330 * body.age;
    state.profile = {
      id: 1, user_id: 1, age: body.age, gender: body.gender, height: body.height, weight: body.weight,
      bmi: Math.round(bmi * 10) / 10, bmr: Math.round(bmr), weekly_workout_days: body.weeklyWorkoutDays,
      workout_duration: body.workoutDuration, preferred_workout_type: body.preferredWorkoutType,
      experience_level: body.experienceLevel, created_at: today(),
    };
    saveState(state);
    return json({ profile: state.profile }, 201);
  }

  // ── Plan ──
  if (path === "/api/plan" && method === "GET") {
    return json({ plans: state.plans });
  }
  if (path === "/api/plan/generate" && method === "POST") {
    if (state.assessments.length === 0) return json({ error: "请先完成体能评估" }, 400);
    if (!state.profile) return json({ error: "请先完善用户画像" }, 400);
    const planData = generateDemoPlan(state);
    const plan = {
      id: Date.now(), user_id: 1,
      plan_data: planData,
      start_date: today(),
      end_date: daysAgo(-28),
      created_at: today(),
    };
    state.plans.unshift(plan);
    saveState(state);
    return json({ plan, feedbackBias: 0 }, 201);
  }
  if (path.match(/^\/api\/plan\/\d+$/) && method === "GET") {
    const p = state.plans[0];
    return p ? json({ plan: p }) : json({ error: "计划不存在" }, 404);
  }

  // ── Feedback ──
  if (path === "/api/feedback" && method === "GET") {
    return json({ feedbacks: state.feedbacks.slice(0, 30) });
  }
  if (path === "/api/feedback" && method === "POST") {
    const fb = { id: Date.now(), user_id: 1, workout_date: body.workoutDate, feedback: body.feedback, notes: body.notes || "", created_at: today() };
    state.feedbacks.unshift(fb);
    saveState(state);
    return json({ feedback: fb }, 201);
  }
  if (path.match(/^\/api\/feedback\/\d+\/notes$/) && method === "PUT") {
    const id = parseInt(path.split("/")[3]);
    const fb = state.feedbacks.find((f: any) => f.id === id);
    if (fb) { fb.notes = body.notes || ""; saveState(state); return json({ feedback: fb }); }
    return json({ error: "记录不存在" }, 404);
  }

  // ── History ──
  if (path === "/api/history") {
    const urlObj = new URL(url, "http://localhost");
    const page = parseInt(urlObj.searchParams.get("page") || "1");
    const list = state.feedbacks.slice((page - 1) * 20, page * 20).map((f: any) => ({
      id: f.id, date: f.workout_date, feedback: f.feedback, notes: f.notes, createdAt: f.created_at,
    }));
    const completed = state.feedbacks.filter((f: any) => f.feedback === "完成" || f.feedback === "部分完成");
    const heatmap: Record<string, string> = {};
    state.feedbacks.forEach((f: any) => { heatmap[f.workout_date] = f.feedback; });
    const streak = calcStreak(state);
    const weekDays = completed.filter((f: any) => f.workout_date >= daysAgo(7)).length;
    return json({
      heatmap, list,
      stats: {
        completed: completed.length,
        tooHard: state.feedbacks.filter((f: any) => f.feedback === "太难").length,
        tooEasy: state.feedbacks.filter((f: any) => f.feedback === "太简单").length,
        totalDays: new Set(state.feedbacks.map((f: any) => f.workout_date)).size,
        streak, weekDays,
      },
      monthStats: {},
      hasMore: state.feedbacks.length > page * 20,
    });
  }

  // ── Measurements ──
  if (path === "/api/measurements" && method === "GET") {
    return json({ measurements: [...state.measurements].reverse() });
  }
  if (path === "/api/measurements" && method === "POST") {
    const m = { id: Date.now(), user_id: 1, measurement_date: body.measurementDate || today(), weight: body.weight, waist: body.waist, chest: body.chest, arm: body.arm, thigh: body.thigh, notes: body.notes || "" };
    state.measurements.push(m);
    saveState(state);
    return json({ measurement: m }, 201);
  }
  if (path.match(/^\/api\/measurements\/\d+$/) && method === "DELETE") {
    const id = parseInt(path.split("/")[3]);
    state.measurements = state.measurements.filter((m: any) => m.id !== id);
    saveState(state);
    return json({ deleted: true });
  }

  // ── Goals ──
  if (path === "/api/goals" && method === "GET") {
    return json({ goals: state.goals });
  }
  if (path === "/api/goals" && method === "POST") {
    const g = { id: Date.now(), user_id: 1, title: body.title, goal_type: body.goalType, target_value: body.targetValue, current_value: body.currentValue || 0, unit: body.unit || "", deadline: body.deadline || null, achieved: 0, achieved_at: null, created_at: today() };
    state.goals.unshift(g);
    saveState(state);
    return json({ goal: g }, 201);
  }
  if (path.match(/^\/api\/goals\/\d+\/progress$/) && method === "PUT") {
    const id = parseInt(path.split("/")[3]);
    const g = state.goals.find((g: any) => g.id === id);
    if (!g) return json({ error: "目标不存在" }, 404);
    g.current_value = body.currentValue;
    if (g.current_value >= g.target_value) { g.achieved = 1; g.achieved_at = today(); }
    saveState(state);
    return json({ success: true, achieved: g.achieved === 1 });
  }
  if (path.match(/^\/api\/goals\/\d+$/) && method === "DELETE") {
    const id = parseInt(path.split("/")[3]);
    state.goals = state.goals.filter((g: any) => g.id !== id);
    saveState(state);
    return json({ success: true });
  }

  // ── Achievements ──
  if (path === "/api/achievements") {
    const totalWorkouts = state.feedbacks.filter((f: any) => f.feedback === "完成" || f.feedback === "部分完成").length;
    const streak = calcStreak(state);
    const measureCount = state.measurements.length;
    let feedbackStreak = 0;
    for (const f of state.feedbacks) { if (f.feedback) feedbackStreak++; else break; }
    let tooEasyStreak = 0;
    for (const f of state.feedbacks) { if (f.feedback === "太简单") tooEasyStreak++; else break; }
    const achievements = [
      { id: "first_workout", name: "初来乍到", desc: "完成第一次训练", icon: "👢", target: 1, unlocked: totalWorkouts >= 1, progress: Math.min(totalWorkouts, 1), rarity: "common" },
      { id: "streak_3", name: "三日之火", desc: "连续训练 3 天", icon: "🔥", target: 3, unlocked: streak >= 3, progress: Math.min(streak, 3), rarity: "common" },
      { id: "streak_7", name: "一周坚持", desc: "连续训练 7 天", icon: "📮", target: 7, unlocked: streak >= 7, progress: Math.min(streak, 7), rarity: "rare" },
      { id: "streak_30", name: "月度之星", desc: "连续训练 30 天", icon: "🌟", target: 30, unlocked: streak >= 30, progress: Math.min(streak, 30), rarity: "epic" },
      { id: "total_10", name: "十次训练", desc: "累计完成 10 次训练", icon: "🔓", target: 10, unlocked: totalWorkouts >= 10, progress: Math.min(totalWorkouts, 10), rarity: "common" },
      { id: "total_50", name: "五十次训练", desc: "累计完成 50 次训练", icon: "🎲", target: 50, unlocked: totalWorkouts >= 50, progress: Math.min(totalWorkouts, 50), rarity: "rare" },
      { id: "total_100", name: "百炼成钢", desc: "累计完成 100 次训练", icon: "🛴", target: 100, unlocked: totalWorkouts >= 100, progress: Math.min(totalWorkouts, 100), rarity: "epic" },
      { id: "total_365", name: "一年的约定", desc: "累计完成 365 次训练", icon: "👫", target: 365, unlocked: totalWorkouts >= 365, progress: Math.min(totalWorkouts, 365), rarity: "legendary" },
      { id: "measure_5", name: "数据达人", desc: "记录 5 次身体数据", icon: "📹", target: 5, unlocked: measureCount >= 5, progress: Math.min(measureCount, 5), rarity: "rare" },
      { id: "measure_20", name: "数据专家", desc: "记录 20 次身体数据", icon: "📳", target: 20, unlocked: measureCount >= 20, progress: Math.min(measureCount, 20), rarity: "epic" },
      { id: "feedback_streak", name: "善于倾听", desc: "连续 5 次训练后给反馈", icon: "👘", target: 5, unlocked: feedbackStreak >= 5, progress: Math.min(feedbackStreak, 5), rarity: "rare" },
      { id: "too_easy_3", name: "挑战者", desc: "连续 3 次觉得训练太简单", icon: "⁉", target: 3, unlocked: tooEasyStreak >= 3, progress: Math.min(tooEasyStreak, 3), rarity: "rare" },
    ];
    let level = 1, levelTitle = "健身新手";
    if (totalWorkouts >= 365) { level = 5; levelTitle = "健身大师"; }
    else if (totalWorkouts >= 100) { level = 4; levelTitle = "健身达人"; }
    else if (totalWorkouts >= 50) { level = 3; levelTitle = "健身爱好者"; }
    else if (totalWorkouts >= 10) { level = 2; levelTitle = "健身学徒"; }
    const xpInLevel = totalWorkouts;
    const xpForNext = level === 1 ? 10 : level === 2 ? 50 : level === 3 ? 100 : level === 4 ? 365 : 365;
    return json({
      achievements,
      stats: { totalWorkouts, streak, measureCount, unlockedCount: achievements.filter((a: any) => a.unlocked).length, total: 12 },
      level: { level, title: levelTitle, xp: xpInLevel, xpForNext },
      rarityStyles: {
        common: "bg-gray-100 text-gray-600 border-gray-200",
        rare: "bg-blue-50 text-blue-600 border-blue-200",
        epic: "bg-purple-50 text-purple-600 border-purple-200",
        legendary: "bg-amber-50 text-amber-600 border-amber-200",
      },
      rarityStars: { common: "⭐", rare: "⭐⭐", epic: "⭐⭐⭐", legendary: "👑" },
    });
  }

  // ── Report ──
  if (path === "/api/report") {
    const startOfWeek = daysAgo(new Date().getDay());
    const weekFeedbacks = state.feedbacks.filter((f: any) => f.workout_date >= startOfWeek);
    const completed = weekFeedbacks.filter((f: any) => f.feedback === "完成").length;
    const partial = weekFeedbacks.filter((f: any) => f.feedback === "部分完成").length;
    const totalWorkouts = state.feedbacks.filter((f: any) => f.feedback === "完成" || f.feedback === "部分完成").length;
    const streak = calcStreak(state);
    let weightChange = null;
    if (state.measurements.length >= 2) {
      const latest = state.measurements[state.measurements.length - 1];
      const prev = state.measurements[state.measurements.length - 2];
      if (latest.weight && prev.weight) weightChange = Math.round((latest.weight - prev.weight) * 10) / 10;
    }
    return json({
      week: { start: startOfWeek, end: today() },
      stats: { completed, partial, total: completed + partial, totalDays: totalWorkouts, streak, weightChange },
      summary: "本周表现不错，继续保持节奏！💪",
      recentDates: state.feedbacks.slice(0, 7).map((f: any) => f.workout_date),
      feedbacks: weekFeedbacks.slice(0, 7),
    });
  }

  // ── Buddy ──
  if (path === "/api/buddy/chat") {
    
    const s = calcStreak(state);
    const replies = [
      "💪 加油！每一次训练都在变得更好",
      "你现在感觉怎么样？记得训练后给我反馈哦～",
      "累了就歇，好了就练，身体会告诉你答案",
      `已经连续训练 ${s} 天了，这份自律真了不起！`,
      "记得补充水分 💧，训练效果会更好",
    ];
    return json({ reply: replies[Math.floor(Math.random() * replies.length)], mode: "rule" });
  }

  // ── Exercises ──
  if (path === "/api/exercises") {
    return json({
      exercises: {
        cardio: [{ name: "慢跑", target: "全身", difficulty: "初级", icon: "🏃" }, { name: "跳绳", target: "全身", difficulty: "中级", icon: "🪢" }],
        strength_upper: [{ name: "俯卧撑", target: "胸+三头", difficulty: "中级", icon: "💪" }, { name: "哑铃弯举", target: "二头", difficulty: "初级", icon: "💪" }],
        strength_lower: [{ name: "深蹲", target: "腿+臀", difficulty: "初级", icon: "🦵" }, { name: "弓步蹲", target: "腿+臀", difficulty: "中级", icon: "🦵" }],
        core: [{ name: "平板支撑", target: "核心", difficulty: "初级", icon: "🧘" }, { name: "卷腹", target: "腹", difficulty: "初级", icon: "🏋️" }],
        flexibility: [{ name: "猫牛式", target: "脊柱", difficulty: "初级", icon: "🐱" }, { name: "下犬式", target: "全身", difficulty: "初级", icon: "🐕" }],
      },
    });
  }

  // ── Export ──
  if (path.startsWith("/api/export")) {
    return json({ exportedAt: today(), type: "history", count: state.feedbacks.length, data: state.feedbacks });
  }

  return json({ error: "Not found in demo" }, 404);
}

// ── Helpers ──

function calcStreak(state: DemoState): number {
  const completed = new Set(
    state.feedbacks
      .filter((f: any) => f.feedback === "完成" || f.feedback === "部分完成")
      .map((f: any) => f.workout_date)
  );
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = new Date(d); ds.setDate(d.getDate() - i);
    if (completed.has(ds.toISOString().split("T")[0])) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function generateDemoPlan(state: DemoState): any {
  // assessments available for plan generation
  const p = state.profile;
  const level = p?.experience_level || "beginner";
  const cardios = [
    { name: "慢跑", sets: 1, reps: 1200, rest: 0, notes: "保持中等强度", target: "全身", difficulty: "初级", icon: "🏃" },
    { name: "快走", sets: 1, reps: 1800, rest: 0, notes: "大步快走", target: "下肢", difficulty: "初级", icon: "🚶" },
    { name: "跳绳", sets: 3, reps: 100, rest: 30, notes: "前脚掌着地", target: "全身", difficulty: "中级", icon: "🪢" },
    { name: "开合跳", sets: 3, reps: 40, rest: 25, notes: "跳起时手脚同时打开", target: "全身", difficulty: "初级", icon: "⭐" },
  ];
  const uppers = [
    { name: "标准俯卧撑", sets: 3, reps: 12, rest: 60, notes: "身体成直线", target: "胸+三头", difficulty: "中级", icon: "💪" },
    { name: "哑铃弯举", sets: 3, reps: 12, rest: 45, notes: "上臂固定", target: "二头", difficulty: "初级", icon: "💪" },
  ];
  const lowers = [
    { name: "深蹲", sets: 3, reps: 15, rest: 60, notes: "膝盖不超过脚尖", target: "腿+臀", difficulty: "初级", icon: "🦵" },
    { name: "弓步蹲", sets: 3, reps: 12, rest: 45, notes: "前后腿90度", target: "腿+臀", difficulty: "中级", icon: "🦵" },
  ];
  const cores = [
    { name: "平板支撑", sets: 3, reps: 45, rest: 30, notes: "身体成一条直线", target: "核心", difficulty: "初级", icon: "🧘" },
    { name: "卷腹", sets: 3, reps: 20, rest: 30, notes: "用腹肌发力", target: "腹", difficulty: "初级", icon: "🏋️" },
  ];
  const warms = ["原地踏步 2min", "肩部绕环 10次", "体转运动 10次", "髋关节环绕 10次"];
  const cools = ["大腿前侧拉伸 30s", "肩部拉伸 30s", "背部拉伸 30s", "深呼吸 5次"];

  function pick(arr: any[], count: number) {
    return arr.slice(0, count).map((e: any) => ({ ...e, sets: level === "beginner" ? Math.max(1, e.sets - 1) : level === "advanced" ? e.sets + 1 : e.sets }));
  }

  const daysPerWeek = p?.weekly_workout_days || 3;
  const weeks: any[] = [];
  for (let w = 1; w <= 4; w++) {
    const workouts: any[] = [];
    const workoutDays = daysPerWeek >= 5 ? [1, 2, 3, 4, 5] : daysPerWeek >= 4 ? [1, 2, 4, 5] : [1, 3, 5];
    for (let d = 1; d <= 7; d++) {
      if (workoutDays.includes(d)) {
        workouts.push({
          day: d, warmup: warms, coolDown: cools,
          main: ["核心训练", "力量训练", "有氧收尾"],
          exercises: [...pick(cores, 2), ...pick(w % 2 === 0 ? uppers : lowers, 2), ...pick(cardios, 1)],
        });
      } else {
        workouts.push({ day: d, warmup: [], main: ["休息日 🧘"], coolDown: [], exercises: [] });
      }
    }
    weeks.push({ week: w, focus: ["适应期", "提升期", "强化期", "冲刺期"][w - 1], workouts });
  }
  return { weeks, summary: { weeklyDays: daysPerWeek, sessionDuration: p?.workout_duration || 45, primaryType: p?.preferred_workout_type || "混合", level: p?.experience_level || "初级", focusAreas: ["全身", "核心"] } };
}
