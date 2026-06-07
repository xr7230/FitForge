const USE_SQLITE = !process.env.DATABASE_URL;

let _pool: any;
let _redis: any;
let _initDb: () => Promise<void>;

class MemCache {
    private store = new Map<string, { value: string; expiry: number | null }>();
    async set(key: string, value: string) { this.store.set(key, { value, expiry: null }); return "OK"; }
    async get(key: string): Promise<string | null> {
      const entry = this.store.get(key); if (!entry) return null;
      if (entry.expiry && Date.now() > entry.expiry) { this.store.delete(key); return null; }
      return entry.value;
    }
    async del(key: string) { this.store.delete(key); return 1; }
  }

if (USE_SQLITE) {
  const BetterSqlite3 = require("better-sqlite3");
  const path = require("path");

  class SqlitePool {
    private db: any;
    constructor(dbPath: string) {
      this.db = new BetterSqlite3(dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
    }
    private convertQuery(text: string): string {
      return text.replace(/\$(\d+)/g, (_: string, n: string) => "?");
    }
    async query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }> {
      const sql = this.convertQuery(text);
      const isSelect = /^\s*SELECT|^\s*WITH/i.test(sql);
      if (isSelect) {
        const stmt = this.db.prepare(sql);
        const rows = params ? stmt.all(...params) : stmt.all();
        return { rows: rows || [] };
      } else {
        const stmt = this.db.prepare(sql);
        const info = params ? stmt.run(...params) : stmt.run();
        if (/RETURNING/i.test(text)) {
          const id = info.lastInsertRowid;
          const tables = ["users", "fitness_assessments", "user_profiles", "workout_plans", "workout_feedback", "body_measurements", "fitness_goals"];
          for (const table of tables) {
            if (text.toLowerCase().includes(table)) {
              const row = this.db.prepare("SELECT * FROM " + table + " WHERE id = ?").get(id);
              if (row) return { rows: [row] };
            }
          }
          return { rows: [] };
        }
        return { rows: [] };
      }
    }
    close() { this.db.close(); }
  }

  const dbPath = path.join(process.cwd(), "fitforge.db");
  _pool = new SqlitePool(dbPath);
  _redis = new MemCache();

  _initDb = async () => {
    const sqliteDb = new BetterSqlite3(dbPath);
    sqliteDb.pragma("journal_mode = WAL");
    sqliteDb.pragma("foreign_keys = ON");
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS fitness_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cardio_endurance INTEGER NOT NULL CHECK (cardio_endurance BETWEEN 1 AND 10),
        muscle_strength INTEGER NOT NULL CHECK (muscle_strength BETWEEN 1 AND 10),
        flexibility INTEGER NOT NULL CHECK (flexibility BETWEEN 1 AND 10),
        balance INTEGER NOT NULL CHECK (balance BETWEEN 1 AND 10),
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_assessments_user ON fitness_assessments(user_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        age INTEGER NOT NULL, gender TEXT NOT NULL,
        height REAL NOT NULL, weight REAL NOT NULL,
        bmi REAL NOT NULL, bmr REAL NOT NULL,
        weekly_workout_days INTEGER NOT NULL,
        workout_duration INTEGER NOT NULL,
        preferred_workout_type TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_data TEXT NOT NULL, start_date TEXT NOT NULL,
        end_date TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_plans_user ON workout_plans(user_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS workout_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        workout_date TEXT NOT NULL, feedback TEXT NOT NULL,
        notes TEXT, created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_feedback_user ON workout_feedback(user_id, workout_date DESC);
      CREATE TABLE IF NOT EXISTS body_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        measurement_date TEXT NOT NULL DEFAULT (date('now')),
        weight REAL, waist REAL, chest REAL, arm REAL, thigh REAL,
        notes TEXT, created_at TEXT DEFAULT (datetime('now'))
      );
            CREATE INDEX IF NOT EXISTS idx_measurements_user ON body_measurements(user_id, measurement_date DESC);
      CREATE TABLE IF NOT EXISTS fitness_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        goal_type TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        unit TEXT,
        deadline TEXT,
        achieved INTEGER DEFAULT 0,
        achieved_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_goals_user ON fitness_goals(user_id, created_at DESC);
    `);
    sqliteDb.close();
    console.log("SQLite 数据库初始化成功 (本地模式)");
  };
} else {
  const { Pool } = require("pg");
  const Redis = require("ioredis");

  _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    _redis = new Redis(redisUrl);
  } else {
    console.log("REDIS_URL ??????????");
    _redis = new MemCache();
  }

  _initDb = async () => {
    try {
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS fitness_assessments (
          id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          cardio_endurance INTEGER NOT NULL CHECK (cardio_endurance BETWEEN 1 AND 10),
          muscle_strength INTEGER NOT NULL CHECK (muscle_strength BETWEEN 1 AND 10),
          flexibility INTEGER NOT NULL CHECK (flexibility BETWEEN 1 AND 10),
          balance INTEGER NOT NULL CHECK (balance BETWEEN 1 AND 10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query("CREATE INDEX IF NOT EXISTS idx_assessments_user ON fitness_assessments(user_id, created_at DESC)");
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          age INTEGER NOT NULL, gender VARCHAR(10) NOT NULL, height REAL NOT NULL, weight REAL NOT NULL,
          bmi REAL NOT NULL, bmr REAL NOT NULL, weekly_workout_days INTEGER NOT NULL,
          workout_duration INTEGER NOT NULL, preferred_workout_type VARCHAR(20) NOT NULL,
          experience_level VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS workout_plans (
          id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          plan_data JSONB NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query("CREATE INDEX IF NOT EXISTS idx_plans_user ON workout_plans(user_id, created_at DESC)");
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS workout_feedback (
          id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          workout_date DATE NOT NULL, feedback VARCHAR(20) NOT NULL,
          notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query("CREATE INDEX IF NOT EXISTS idx_feedback_user ON workout_feedback(user_id, workout_date DESC)");
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
          weight REAL, waist REAL, chest REAL, arm REAL, thigh REAL,
          notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query("CREATE INDEX IF NOT EXISTS idx_measurements_user ON body_measurements(user_id, measurement_date DESC)");
      await _pool.query(`
        CREATE TABLE IF NOT EXISTS fitness_goals (
          id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL, goal_type VARCHAR(50) NOT NULL,
          target_value REAL NOT NULL, current_value REAL DEFAULT 0,
          unit VARCHAR(50), deadline DATE,
          achieved INTEGER DEFAULT 0, achieved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await _pool.query("CREATE INDEX IF NOT EXISTS idx_goals_user ON fitness_goals(user_id, created_at DESC)");

      console.log("PostgreSQL 数据库初始化成功");
    } catch (error) {
      console.error("数据库初始化失败:", error);
      throw error;
    }
  };
}

export const pool = _pool;
export const redis = _redis;
export const initializeDatabase = _initDb;
