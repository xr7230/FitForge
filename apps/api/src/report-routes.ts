import { Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerReportRoutes(app: any, authMiddleware: any) {
  app.get("/api/report", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startStr = startOfWeek.toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];

      // 本周训练统计
      const fbResult = await pool.query(
        `SELECT feedback, workout_date, notes FROM workout_feedback WHERE user_id = $1 AND workout_date >= $2 ORDER BY workout_date DESC`,
        [userId, startStr]
      );
      const feedbacks = fbResult.rows || [];
      const completedCount = feedbacks.filter((f: any) => f.feedback === "完成").length;
      const partialCount = feedbacks.filter((f: any) => f.feedback === "部分完成").length;

      // 总训练天数
      const totalResult = await pool.query(
        `SELECT COUNT(DISTINCT workout_date) as cnt FROM workout_feedback WHERE user_id = $1`,
        [userId]
      );
      const totalDays = totalResult.rows[0]?.cnt || 0;

      // 连续天数
      const allDates = await pool.query(
        `SELECT DISTINCT workout_date FROM workout_feedback WHERE user_id = $1 AND feedback = '完成' ORDER BY workout_date DESC`,
        [userId]
      );
      const dates = (allDates.rows || []).map((r: any) => r.workout_date);
      let streak = 0;
      const check = new Date(todayStr);
      for (const d of dates) {
        const expected = new Date(check);
        expected.setDate(expected.getDate() - streak);
        if (d === expected.toISOString().split("T")[0]) streak++;
        else if (streak === 0) { check.setDate(check.getDate() - 1); if (d === check.toISOString().split("T")[0]) streak++; else break; }
        else break;
      }

      // 身体数据变化
      const measResult = await pool.query(
        `SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY measurement_date DESC LIMIT 2`,
        [userId]
      );
      const measurements = measResult.rows || [];
      let weightChange = null;
      if (measurements.length >= 2 && measurements[0].weight && measurements[1].weight) {
        weightChange = measurements[0].weight - measurements[1].weight;
      }

      // 本周mood（用反馈数作为简单代理 - 从feedback推测）
      const weekWorkouts = feedbacks.length;

      // AI总结
      const summary = generateWeeklySummary(completedCount, partialCount, weekWorkouts, streak, weightChange);

      // 最近训练日期列表
      const recentDates = dates.slice(0, 7);

      res.json({
        week: { start: startStr, end: todayStr },
        stats: {
          completed: completedCount,
          partial: partialCount,
          total: weekWorkouts,
          totalDays,
          streak,
          weightChange: weightChange !== null ? Math.round(weightChange * 10) / 10 : null,
        },
        summary,
        recentDates,
        feedbacks: feedbacks.slice(0, 7),
      });
    } catch (error) {
      console.error("Report error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });
}

function generateWeeklySummary(completed: number, partial: number, total: number, streak: number, weightChange: number | null): string {
  const parts: string[] = [];

  if (total === 0) {
    return "这周还没有开始训练哦～给自己一个温柔的启动，哪怕只是散步10分钟也是个好开始 🌱";
  }

  if (completed >= 5) {
    parts.push("非常棒的一周！你的坚持让人佩服 👏");
  } else if (completed >= 3) {
    parts.push("这周表现不错，继续保持节奏 💪");
  } else if (completed >= 1) {
    parts.push("好的开始是成功的一半，下周再加把劲 🔥");
  }

  if (streak >= 7) {
    parts.push("已经连续训练" + streak + "天，你正在形成强大的习惯！");
  } else if (streak >= 3) {
    parts.push("连续" + streak + "天的坚持，身体已经开始适应了～");
  }

  if (weightChange !== null) {
    if (weightChange < -0.5) {
      parts.push("体重下降了" + Math.abs(weightChange).toFixed(1) + "kg，饮食和训练的配合很棒！");
    } else if (weightChange > 0.5) {
      parts.push("体重略有上升，可能是在增肌，也可能需要注意饮食哦～");
    } else {
      parts.push("体重保持稳定，身体在适应新的节奏。");
    }
  }

  if (partial > 0) {
    parts.push("有" + partial + "次部分完成，没关系，量力而行最重要。");
  }

  if (parts.length === 0) parts.push("保持运动，身体会给你最好的回报 🌟");

  return parts.join(" ");
}
