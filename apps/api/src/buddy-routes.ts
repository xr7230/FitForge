import { Response } from "express";
import { pool } from "./database";

interface AuthRequest extends Request { userId?: number; }

const personality = {
  morning: [
    "早上好！新的一天，先活动一下关节唤醒身体 ☀️",
    "早安！你今天看起来元气满满，要不要来组晨间拉伸？",
    "早啊～昨晚睡得好吗？睡得好训练效果翻倍哦",
  ],
  afternoon: [
    "下午好～坐久了吧？起来活动5分钟！",
    "午饭消化得差不多了，是时候动一动了 🔥",
    "下午来场训练，晚上睡得香",
  ],
  evening: [
    "一天辛苦了，来个舒缓的拉伸放松身体 🧘",
    "晚上训练注意别太剧烈，影响睡眠～",
    "今天的训练完成了没？没完成也没关系，明天继续",
  ],
};

const contextualPhrases: Record<string, string[]> = {
  highStreak: [
    "连续{streak}天训练！你已经把运动变成习惯了，真了不起 👏",
    "连续{streak}天不间断，这份自律配得上最好的结果",
  ],
  needsEncouragement: [
    "别给自己太大压力，动起来就已经赢了昨天的自己",
    "累了就歇，好了就练，身体会告诉你答案 💪",
    "不用和别人比，今天的你比昨天强就够了",
  ],
  goalProgress: [
    "你的「{goalTitle}」目标已完成 {progress}%，继续保持！",
    "看着你的目标一点点接近，我也跟着开心 🎯",
  ],
  restDay: [
    "今天是休息日，好好恢复！肌肉在休息时生长",
    "休息不是偷懒，是训练的一部分。顶尖运动员都懂",
  ],
  newUser: [
    "初次见面！我是你的健身搭子小铁 💪 先从体能评估开始认识你吧",
    "欢迎加入 FitForge！让我们一步步来，先了解一下你的身体状况",
  ],
};

export function registerBuddyRoutes(app: any, authMiddleware: any) {
  app.post("/api/buddy/chat", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const body: any = req.body;
      const { message } = body;

      // Collect user data for context
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 10 ? "morning" : hour < 14 ? "afternoon" : "evening";

      // Streak
      const fbResult = await pool.query(
        "SELECT workout_date, feedback FROM workout_feedback WHERE user_id = $1 ORDER BY workout_date DESC LIMIT 30",
        [userId]
      );
      const dates = (fbResult.rows || [])
        .filter((r: any) => r.feedback === "完成")
        .map((r: any) => r.workout_date);

      let streak = 0;
      const todayStr = now.toISOString().split("T")[0];
      const check = new Date(todayStr);
      for (const d of dates) {
        const expected = new Date(check);
        expected.setDate(expected.getDate() - streak);
        if (d === expected.toISOString().split("T")[0]) streak++;
        else break;
      }

      // Total workouts
      const totalResult = await pool.query(
        "SELECT COUNT(*) as cnt FROM workout_feedback WHERE user_id = ?",
        [userId]
      );
      const totalWorkouts = totalResult.rows[0]?.cnt || 0;

      // Goals
      const goalResult = await pool.query(
        "SELECT * FROM fitness_goals WHERE user_id = $1 AND achieved = 0 ORDER BY created_at DESC",
        [userId]
      );
      const goals = goalResult.rows || [];

      // Check if user is new (no plan)
      const planResult = await pool.query(
        "SELECT id FROM workout_plans WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      const hasPlan = planResult.rows.length > 0;

      // ── Determine if LLM is available ──
      const llmConfig = body.llmConfig;
      const useLLM = llmConfig && llmConfig.apiKey && llmConfig.provider && message && message.trim().length > 0;

      if (useLLM) {
        try {
          const llmReply = await callLLM(llmConfig, buildSystemPrompt({ streak, totalWorkouts, goals, hasPlan, timeOfDay }), message);
          res.json({ reply: llmReply, mode: "llm" });
          return;
        } catch (llmErr) {
          console.error("LLM error, falling back to rule-based:", llmErr);
          // Fall through to rule-based
        }
      }

      // ── Rule-based response ──
      const reply = generateRuleBasedResponse({
        streak, totalWorkouts, goals, hasPlan, timeOfDay, message,
      });

      res.json({ reply, mode: "rule" });
    } catch (error) {
      console.error("Buddy chat error:", error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  });
}

function generateRuleBasedResponse(ctx: {
  streak: number; totalWorkouts: number; goals: any[];
  hasPlan: boolean; timeOfDay: string; message: string;
}): string {
  const { streak, totalWorkouts, goals, hasPlan, timeOfDay, message } = ctx;

  // If user sent a message, try to respond to it
  if (message && message.trim()) {
    const msg = message.toLowerCase();
    if (/今天.*练|训练|workout/.test(msg)) {
      if (!hasPlan) return "你还没生成训练计划呢～先去完成体能评估，我帮你定制一个专属计划 💪";
      return "有！打开「计划」页面看看今天的安排。准备好了就点「开始训练」🏋️";
    }
    if (/累|不想|懒|休息/.test(msg)) {
      return "没关系，累了就好好休息。身体需要恢复才能变强。今天就当充电日 🔋";
    }
    if (/吃|饮食|怎么吃/.test(msg)) {
      return "训练后30分钟内补充蛋白质效果最好！一杯牛奶+一根香蕉就是完美的恢复餐 🥛🍌";
    }
    if (/你好|你是谁|叫什么/.test(msg)) {
      return "我是小铁，你的专属健身搭子 💪 帮你定制计划、陪你训练、记录进步！";
    }
    if (/目标|目标/.test(msg)) {
      if (goals.length > 0) {
        const g = goals[0];
        const pct = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
        return `你当前的目标「${g.title}」已完成 ${pct}%，目前 ${g.current_value}/${g.target_value} ${g.unit || ''}。继续加油！`;
      }
      return "你还没设定目标哦～去「目标」页面设定一个，我帮你追踪进度 🎯";
    }
    // Generic fallback
    const fallbacks = [
      "嗯嗯，我在听～有什么训练相关的问题尽管问我",
      "运动相关的问题我比较在行，你想了解什么？",
      "💪 小铁永远支持你！想聊训练、饮食、恢复都行",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // No message - proactive greeting based on context
  if (!hasPlan && totalWorkouts === 0) {
    return pickRandom(personality[timeOfDay as keyof typeof personality]) + " 我们先做个体能评估，让我了解你的起点 🏁";
  }

  const parts: string[] = [];
  parts.push(pickRandom(personality[timeOfDay as keyof typeof personality]));

  if (streak >= 7) {
    parts.push(pickRandom(contextualPhrases.highStreak).replace("{streak}", String(streak)));
  } else if (streak >= 3) {
    parts.push(`已经连续 ${streak} 天训练，势头不错 🔥`);
  }

  if (goals.length > 0) {
    const g = goals[0];
    const pct = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
    parts.push(`你的目标「${g.title}」进度 ${pct}%，继续保持！`);
  }

  if (parts.length === 1) {
    parts.push(pickRandom(contextualPhrases.needsEncouragement));
  }

  return parts.join(" ");
}

async function callLLM(config: { apiKey: string; provider: string; model?: string }, systemPrompt: string, userMessage: string): Promise<string> {
  const provider = config.provider || "openai";
  let endpoint: string;
  let headers: Record<string, string>;
  let body: any;

  if (provider === "openai") {
    endpoint = "https://api.openai.com/v1/chat/completions";
    headers = { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` };
    body = {
      model: config.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.8,
    };
  } else if (provider === "deepseek") {
    endpoint = "https://api.deepseek.com/v1/chat/completions";
    headers = { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` };
    body = {
      model: config.model || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.8,
    };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

function buildSystemPrompt(ctx: {
  streak: number; totalWorkouts: number; goals: any[];
  hasPlan: boolean; timeOfDay: string;
}): string {
  return `你是小铁，一个温暖、鼓励型的健身搭子AI。你的风格：
- 简短、口语化，像朋友聊天
- 适度使用 emoji（每2-3句一个）
- 关注用户的状态并给出个性化建议
- 不提供专业医疗建议

当前用户状态：
- 训练总次数：${ctx.totalWorkouts}
- 连续训练天数：${ctx.streak}
- 是否有训练计划：${ctx.hasPlan ? '有' : '无'}
- 进行中目标：${ctx.goals.length > 0 ? ctx.goals.map((g: any) => `${g.title}(${g.current_value}/${g.target_value})`).join(', ') : '无'}
- 时间：${ctx.timeOfDay === 'morning' ? '早上' : ctx.timeOfDay === 'afternoon' ? '下午' : '晚上'}`;
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
