import { Request, Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

interface Achievement {
  id: string; name: string; desc: string; icon: string; unlocked: boolean;
  progress: number; target: number; rarity: "common" | "rare" | "epic" | "legendary";
}

const ACHIEVEMENTS: Omit<Achievement, "unlocked" | "progress">[] = [
  { id: "first_workout", name: "初来乍到", desc: "完成第一次训练", icon: "👋", target: 1, rarity: "common" },
  { id: "streak_3", name: "三日之火", desc: "连续训练 3 天", icon: "🔥", target: 3, rarity: "common" },
  { id: "streak_7", name: "一周坚持", desc: "连续训练 7 天", icon: "📅", target: 7, rarity: "rare" },
  { id: "streak_30", name: "月度之星", desc: "连续训练 30 天", icon: "🌟", target: 30, rarity: "epic" },
  { id: "total_10", name: "十次训练", desc: "累计完成 10 次训练", icon: "🔟", target: 10, rarity: "common" },
  { id: "total_50", name: "五十次训练", desc: "累计完成 50 次训练", icon: "🏅", target: 50, rarity: "rare" },
  { id: "total_100", name: "百炼成钢", desc: "累计完成 100 次训练", icon: "💯", target: 100, rarity: "epic" },
  { id: "total_365", name: "一年的约定", desc: "累计完成 365 次训练", icon: "👑", target: 365, rarity: "legendary" },
  { id: "measure_5", name: "数据达人", desc: "记录 5 次身体数据", icon: "📏", target: 5, rarity: "rare" },
  { id: "measure_20", name: "数据专家", desc: "记录 20 次身体数据", icon: "📊", target: 20, rarity: "epic" },
  { id: "feedback_streak", name: "善于倾听", desc: "连续 5 次训练后给反馈", icon: "👂", target: 5, rarity: "rare" },
  { id: "too_easy_3", name: "挑战者", desc: "连续 3 次觉得训练太简单", icon: "⚡", target: 3, rarity: "rare" },
];

const rarityColors: Record<string, string> = {
  common: "bg-gray-100 text-gray-600 border-gray-200",
  rare: "bg-blue-50 text-blue-600 border-blue-200",
  epic: "bg-purple-50 text-purple-600 border-purple-200",
  legendary: "bg-amber-50 text-amber-600 border-amber-200",
};

const rarityStars: Record<string, string> = {
  common: "⭐",
  rare: "⭐⭐",
  epic: "⭐⭐⭐",
  legendary: "👑",
};

export function registerAchievementRoutes(app: any, authMiddleware: any) {

app.get("/api/achievements", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 总训练次数
    const totalResult = await pool.query(
      "SELECT COUNT(*) as cnt FROM workout_feedback WHERE user_id = $1 AND feedback IN ('完成','部分完成')",
      [userId]
    );
    const totalWorkouts = parseInt(totalResult.rows[0].cnt);

    // 连续天数
    const fbResult = await pool.query(
      "SELECT workout_date, feedback FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date DESC LIMIT 365",
      [userId]
    );
    const completedDates = new Set(
      fbResult.rows
        .filter((r: any) => r.feedback === "完成" || r.feedback === "部分完成")
        .map((r: any) => new Date(r.workout_date).toISOString().split("T")[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (completedDates.has(d.toISOString().split("T")[0])) streak++;
      else if (i > 0) break;
    }

    // 身体数据记录次数
    const measureResult = await pool.query(
      "SELECT COUNT(*) as cnt FROM body_measurements WHERE user_id = $1",
      [userId]
    );
    const measureCount = parseInt(measureResult.rows[0].cnt);

    // 连续反馈次数
    let feedbackStreak = 0;
    for (const r of fbResult.rows) {
      if (r.feedback) feedbackStreak++;
      else break;
    }

    // 连续"太简单"
    let tooEasyStreak = 0;
    for (const r of fbResult.rows) {
      if (r.feedback === "太简单") tooEasyStreak++;
      else break;
    }

    // 计算成就
    const achievements: Achievement[] = ACHIEVEMENTS.map(a => {
      let progress = 0;
      switch (a.id) {
        case "first_workout": progress = Math.min(totalWorkouts, 1); break;
        case "streak_3": progress = Math.min(streak, 3); break;
        case "streak_7": progress = Math.min(streak, 7); break;
        case "streak_30": progress = Math.min(streak, 30); break;
        case "total_10": progress = Math.min(totalWorkouts, 10); break;
        case "total_50": progress = Math.min(totalWorkouts, 50); break;
        case "total_100": progress = Math.min(totalWorkouts, 100); break;
        case "total_365": progress = Math.min(totalWorkouts, 365); break;
        case "measure_5": progress = Math.min(measureCount, 5); break;
        case "measure_20": progress = Math.min(measureCount, 20); break;
        case "feedback_streak": progress = Math.min(feedbackStreak, 5); break;
        case "too_easy_3": progress = Math.min(tooEasyStreak, 3); break;
      }
      return {
        ...a,
        unlocked: progress >= a.target,
        progress,
      };
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // 等级：基于总训练次数
    let level = 1, levelTitle = "健身新手";
    if (totalWorkouts >= 365) { level = 5; levelTitle = "健身大师"; }
    else if (totalWorkouts >= 100) { level = 4; levelTitle = "健身达人"; }
    else if (totalWorkouts >= 50) { level = 3; levelTitle = "健身爱好者"; }
    else if (totalWorkouts >= 10) { level = 2; levelTitle = "健身学徒"; }

    const xpInLevel = totalWorkouts % (level === 1 ? 10 : level === 2 ? 40 : level === 3 ? 50 : level === 4 ? 265 : 0);
    const xpForNext = level === 1 ? 10 : level === 2 ? 50 : level === 3 ? 100 : level === 4 ? 365 : 365;

    res.json({
      achievements,
      stats: { totalWorkouts, streak, measureCount, unlockedCount, total: ACHIEVEMENTS.length },
      level: { level, title: levelTitle, xp: xpInLevel, xpForNext },
      rarityStyles: rarityColors,
      rarityStars,
    });
  } catch (error) {
    console.error("achievements error:", error);
    res.status(500).json({ error: "server error" });
  }
});

}
