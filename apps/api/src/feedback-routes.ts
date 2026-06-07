import { Request, Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerFeedbackRoutes(app: any, authMiddleware: any, validate: any) {

// 提交反馈（含笔记）
app.post("/api/feedback", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { workoutDate, feedback, notes } = req.body;
    const err = validate({ workoutDate: "string", feedback: "string" }, req.body);
    if (err) { res.status(400).json({ error: err }); return; }
    if (!["完成", "太难", "太简单", "部分完成"].includes(feedback)) {
      res.status(400).json({ error: "反馈内容无效" }); return;
    }
    const saved = await pool.query(
      "INSERT INTO workout_feedback (user_id, workout_date, feedback, notes) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.userId, workoutDate, feedback, notes || null]
    );
    res.status(201).json({ feedback: saved.rows[0] });
  } catch {
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 获取反馈列表
app.get("/api/feedback", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const fbs = await pool.query(
      "SELECT id, user_id, workout_date, feedback, notes, created_at FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date DESC LIMIT 30",
      [req.userId]
    );
    res.json({ feedbacks: fbs.rows });
  } catch {
    res.status(500).json({ error: "服务器内部错误" });
  }
});

// 更新笔记
app.put("/api/feedback/:id/notes", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const result = await pool.query(
      "UPDATE workout_feedback SET notes = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [notes || null, req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "记录不存在" }); return;
    }
    res.json({ feedback: result.rows[0] });
  } catch {
    res.status(500).json({ error: "服务器内部错误" });
  }
});

}
