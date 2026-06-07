import React, { useState, useEffect } from "react";

interface Achievement {
  id: string; name: string; desc: string; icon: string; unlocked: boolean;
  progress: number; target: number; rarity: "common" | "rare" | "epic" | "legendary";
}

interface LevelInfo { level: number; title: string; xp: number; xpForNext: number; }

const rarityColors: Record<string, string> = {
  common: "border-gray-200 bg-gray-50",
  rare: "border-blue-200 bg-blue-50",
  epic: "border-purple-200 bg-purple-50",
  legendary: "border-amber-200 bg-amber-50",
};

const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-blue-100",
  epic: "shadow-purple-100",
  legendary: "shadow-amber-100",
};

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [level, setLevel] = useState<LevelInfo>({ level: 1, title: "健身新手", xp: 0, xpForNext: 10 });
  const [stats, setStats] = useState({ unlockedCount: 0, total: 0, totalWorkouts: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/achievements`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(data => {
        setAchievements(data.achievements || []);
        setLevel(data.level || { level: 1, title: "健身新手", xp: 0, xpForNext: 10 });
        setStats(data.stats || { unlockedCount: 0, total: 0, totalWorkouts: 0, streak: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  const xpPercent = level.xpForNext > 0 ? Math.min(100, Math.round((level.xp / level.xpForNext) * 100)) : 100;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-6">🏆 成就</h2>

        {/* 等级卡 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl shadow-sm">
              {level.level >= 5 ? "👑" : level.level >= 4 ? "💎" : level.level >= 3 ? "⭐" : level.level >= 2 ? "🔥" : "🌱"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Lv.{level.level} {level.title}</p>
              <p className="text-xs text-gray-400">{stats.totalWorkouts} 次训练 · {stats.streak} 天连续</p>
              <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: xpPercent + "%" }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {level.xpForNext > 0 ? `距离下一级还需 ${level.xpForNext - level.xp} 次训练` : "已达最高等级！"}
              </p>
            </div>
          </div>
        </div>

        {/* 已解锁成就 */}
        {unlocked.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              ✨ 已解锁 ({unlocked.length}/{stats.total})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {unlocked.map(a => (
                <div key={a.id}
                  className={`rounded-xl p-3 border shadow-sm transition-all ${rarityColors[a.rarity]} ${rarityGlow[a.rarity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-xs font-bold">{a.name}</span>
                  </div>
                  <p className="text-[10px] opacity-70">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未解锁成就 */}
        {locked.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              🔒 待解锁 ({locked.length})
            </h3>
            <div className="space-y-2">
              {locked.map(a => (
                <div key={a.id}
                  className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 opacity-60 hover:opacity-80 transition-opacity">
                  <span className="text-2xl grayscale">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-gray-600">{a.name}</span>
                      <span className="text-[10px] text-gray-400">{a.progress}/{a.target}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full transition-all"
                        style={{ width: Math.round((a.progress / a.target) * 100) + "%" }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
