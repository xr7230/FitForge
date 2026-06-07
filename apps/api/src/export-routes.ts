import { Request, Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerExportRoutes(app: any, authMiddleware: any) {

// 导出训练历史
app.get("/api/export/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const format = req.query.format || "json";
    const result = await pool.query(
      `SELECT workout_date, feedback, notes, created_at FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date ASC`,
      [req.userId]
    );

    if (format === "csv") {
      let csv = "日期,反馈,笔记,记录时间\n";
      result.rows.forEach((r: any) => {
        const escape = (s: string | null) => s ? `"${(s || "").replace(/"/g, '""')}"` : "";
        csv += `${r.workout_date},${r.feedback},${escape(r.notes)},${r.created_at}\n`;
      });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=fitforge-history.csv");
      res.send("\uFEFF" + csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=fitforge-history.json");
      res.json({ exportedAt: new Date().toISOString(), type: "history", count: result.rows.length, data: result.rows });
    }
  } catch {
    res.status(500).json({ error: "导出失败" });
  }
});

// 导出身体数据
app.get("/api/export/measurements", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const format = req.query.format || "json";
    const result = await pool.query(
      `SELECT measurement_date, weight, waist, chest, arm, thigh, notes FROM body_measurements WHERE user_id = $1 ORDER BY measurement_date ASC`,
      [req.userId]
    );

    if (format === "csv") {
      let csv = "日期,体重(kg),腰围(cm),胸围(cm),臂围(cm),腿围(cm),备注\n";
      result.rows.forEach((r: any) => {
        csv += `${r.measurement_date},${r.weight || ""},${r.waist || ""},${r.chest || ""},${r.arm || ""},${r.thigh || ""},"${(r.notes || "").replace(/"/g, '""')}"\n`;
      });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=fitforge-measurements.csv");
      res.send("\uFEFF" + csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=fitforge-measurements.json");
      res.json({ exportedAt: new Date().toISOString(), type: "measurements", count: result.rows.length, data: result.rows });
    }
  } catch {
    res.status(500).json({ error: "导出失败" });
  }
});

// 导出全部数据（打包）
app.get("/api/export/all", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
    const assessments = await pool.query("SELECT * FROM fitness_assessments WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const feedbacks = await pool.query("SELECT workout_date, feedback, notes, created_at FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date ASC", [userId]);
    const measurements = await pool.query("SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY measurement_date ASC", [userId]);
    const plans = await pool.query("SELECT id, start_date, end_date, created_at FROM workout_plans WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=fitforge-all-data.json");
    res.json({
      exportedAt: new Date().toISOString(),
      profile: profile.rows[0] || null,
      assessments: assessments.rows,
      feedbacks: feedbacks.rows,
      measurements: measurements.rows,
      plans: plans.rows,
    });
  } catch {
    res.status(500).json({ error: "导出失败" });
  }
});

}
