import { Request, Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerHistoryRoutes(app: any, authMiddleware: any) {

// ── 训练历史 ──
app.get("/api/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const userId = req.userId!;
    const params: any[] = [userId];

    // 近一年每日状态（热力图）
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const heatmapResult = await pool.query(
      `SELECT workout_date, feedback FROM workout_feedback
       WHERE user_id = $1 AND workout_date >= $2
       ORDER BY workout_date ASC`,
      [userId, yearAgo.toISOString().split("T")[0]]
    );
    const heatmap: Record<string, string> = {};
    heatmapResult.rows.forEach((r: any) => {
      heatmap[new Date(r.workout_date).toISOString().split("T")[0]] = r.feedback;
    });

    // 历史列表（分页）
    const page = parseInt((req.query.page as string) || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const listResult = await pool.query(
      `SELECT wf.workout_date, wf.feedback, wf.notes, wf.created_at, wf.id
       FROM workout_feedback wf
       WHERE wf.user_id = $1
       ORDER BY wf.workout_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // 统计
    const statsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE feedback IN ('完成','部分完成')) as completed,
         COUNT(*) FILTER (WHERE feedback = '太难') as too_hard,
         COUNT(*) FILTER (WHERE feedback = '太简单') as too_easy,
         COUNT(DISTINCT workout_date) as total_days
       FROM workout_feedback WHERE user_id = $1`,
      [userId]
    );

    // 连续天数
    const allDates = heatmapResult.rows
      .filter((r: any) => r.feedback === "完成" || r.feedback === "部分完成")
      .map((r: any) => new Date(r.workout_date).toISOString().split("T")[0]);
    const completedSet = new Set(allDates);
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (completedSet.has(d.toISOString().split("T")[0])) streak++;
      else if (i > 0) break;
    }

    // 本周训练天数
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekDays = allDates.filter((d: string) => d >= weekStart.toISOString().split("T")[0]).length;

    // 月统计
    let monthStats: Record<string, number> = {};
    if (year && month) {
      const monthStart = `${year}-${String(parseInt(month as string)).padStart(2,"0")}-01`;
      const monthEnd = `${year}-${String(parseInt(month as string)).padStart(2,"0")}-31`;
      const monthResult = await pool.query(
        `SELECT feedback, COUNT(*) as cnt FROM workout_feedback
         WHERE user_id = $1 AND workout_date >= $2 AND workout_date <= $3
         GROUP BY feedback`,
        [userId, monthStart, monthEnd]
      );
      monthResult.rows.forEach((r: any) => { monthStats[r.feedback] = parseInt(r.cnt); });
    }

    res.json({
      heatmap,
      list: listResult.rows.map((r: any) => ({
        id: r.id, date: r.workout_date, feedback: r.feedback, notes: r.notes, createdAt: r.created_at,
      })),
      stats: {
        completed: parseInt(statsResult.rows[0]?.completed || "0"),
        tooHard: parseInt(statsResult.rows[0]?.too_hard || "0"),
        tooEasy: parseInt(statsResult.rows[0]?.too_easy || "0"),
        totalDays: parseInt(statsResult.rows[0]?.total_days || "0"),
        streak,
        weekDays,
      },
      monthStats,
      hasMore: listResult.rows.length === limit,
    });
  } catch (error) {
    console.error("获取历史记录失败:", error);
    res.status(500).json({ error: "服务器内部错误" });
  }
});

}
