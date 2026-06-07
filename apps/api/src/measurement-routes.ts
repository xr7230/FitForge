import { Request, Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

export function registerMeasurementRoutes(app: any, authMiddleware: any) {

// ── 保存身体数据
app.post("/api/measurements", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { weight, waist, chest, arm, thigh, notes, measurementDate } = req.body;
    const date = measurementDate || new Date().toISOString().split("T")[0];
    const result = await pool.query(
      "INSERT INTO body_measurements (user_id, measurement_date, weight, waist, chest, arm, thigh, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [req.userId, date, weight || null, waist || null, chest || null, arm || null, thigh || null, notes || null]
    );
    res.status(201).json({ measurement: result.rows[0] });
  } catch (error) {
    console.error("save measurement error:", error);
    res.status(500).json({ error: "server error" });
  }
});

// ── 获取身体数据列表
app.get("/api/measurements", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "30");
    const result = await pool.query(
      "SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY measurement_date DESC LIMIT $2",
      [req.userId, limit]
    );
    const list = [...result.rows].reverse();
    res.json({ measurements: list });
  } catch {
    res.status(500).json({ error: "server error" });
  }
});

// ── 删除记录
app.delete("/api/measurements/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM body_measurements WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "not found" }); return; }
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: "server error" });
  }
});

}
