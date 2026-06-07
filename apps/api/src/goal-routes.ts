import { Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerGoalRoutes(app: any, authMiddleware: any) {
  app.get("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT * FROM fitness_goals WHERE user_id = $1 ORDER BY created_at DESC",
        [req.userId!]
      );
      res.json({ goals: result.rows || [] });
    } catch (error) {
      console.error("Goals fetch error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });

  app.post("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const body: any = req.body;
      const { title, goalType, targetValue, currentValue, unit, deadline } = body;
      if (!title || !goalType || !targetValue) {
        res.status(400).json({ error: "缺少必填字段" });
        return;
      }
      await pool.query(
        "INSERT INTO fitness_goals (user_id, title, goal_type, target_value, current_value, unit, deadline) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [req.userId!, title, goalType, targetValue, currentValue || 0, unit || "", deadline || null]
      );
      const goals = await pool.query(
        "SELECT * FROM fitness_goals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [req.userId!]
      );
      res.status(201).json({ goal: goals.rows[0] });
    } catch (error) {
      console.error("Goal create error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });

  app.put("/api/goals/:id/progress", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const body: any = req.body;
      const { currentValue } = body;
      if (currentValue === undefined || currentValue === null) {
        res.status(400).json({ error: "缺少当前值" });
        return;
      }
      const id = (req as any).params.id;
      const existing = await pool.query(
        "SELECT * FROM fitness_goals WHERE id = $1 AND user_id = $2",
        [id, req.userId!]
      );
      if (existing.rows.length === 0) {
        res.status(404).json({ error: "目标不存在" });
        return;
      }
      const goal = existing.rows[0];
      const achieved = Number(currentValue) >= Number(goal.target_value);
      await pool.query(
        "UPDATE fitness_goals SET current_value = $1, achieved = $2, achieved_at = $3 WHERE id = $4 AND user_id = $5",
        [currentValue, achieved ? 1 : 0, achieved ? new Date().toISOString() : null, id, req.userId!]
      );
      res.json({ success: true, achieved });
    } catch (error) {
      console.error("Goal update error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });

  app.delete("/api/goals/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const id = (req as any).params.id;
      await pool.query(
        "DELETE FROM fitness_goals WHERE id = $1 AND user_id = $2",
        [id, req.userId!]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Goal delete error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });
}
