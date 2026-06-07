import React, { useState, useEffect } from "react";

interface Exercise {
  name: string; sets: number; reps: number; rest: number;
  notes: string; target?: string; difficulty?: string; icon?: string;
}

type CategoryKey = "cardio" | "strength_upper" | "strength_lower" | "core" | "flexibility" | "balance";

interface ExerciseLibrary {
  [key: string]: Exercise[];
}

const categoryMeta: Record<CategoryKey, { label: string; icon: string; desc: string }> = {
  cardio: { label: "有氧燃脂", icon: "🔥", desc: "提升心肺，燃烧卡路里" },
  strength_upper: { label: "上肢力量", icon: "💪", desc: "胸、背、肩、手臂" },
  strength_lower: { label: "下肢力量", icon: "🦵", desc: "臀腿训练，打好根基" },
  core: { label: "核心训练", icon: "🎯", desc: "腹肌、稳定、力量传导" },
  flexibility: { label: "柔韧拉伸", icon: "🧘", desc: "提高柔韧，预防损伤" },
  balance: { label: "平衡稳定", icon: "⚖️", desc: "本体感觉，协调控制" },
};

const difficultyBadge: Record<string, string> = {
  "初级": "bg-emerald-100 text-emerald-700",
  "中级": "bg-amber-100 text-amber-700",
  "高级": "bg-red-100 text-red-700",
};

const Exercises: React.FC = () => {
  const [library, setLibrary] = useState<ExerciseLibrary>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">("all");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/exercises`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(data => { setLibrary(data.exercises || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const allExercises: (Exercise & { category: CategoryKey })[] = [];
  for (const [cat, exercises] of Object.entries(library)) {
    for (const ex of exercises) {
      allExercises.push({ ...ex, category: cat as CategoryKey });
    }
  }

  const filtered = allExercises.filter(ex => {
    if (activeCategory !== "all" && ex.category !== activeCategory) return false;
    if (difficultyFilter !== "all" && ex.difficulty !== difficultyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!ex.name.toLowerCase().includes(q) && !(ex.target || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-1">📚 动作库</h2>
        <p className="text-xs text-gray-400 mb-4">浏览全部动作，了解正确姿势</p>

        <div className="relative mb-4">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索动作名称或目标肌群..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">✕</button>
          )}
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === "all" ? "bg-amber-400 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-amber-200"}`}>
            全部
          </button>
          {(Object.keys(categoryMeta) as CategoryKey[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? "bg-amber-400 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-amber-200"}`}>
              {categoryMeta[cat].icon} {categoryMeta[cat].label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-5">
          {["all", "初级", "中级", "高级"].map(d => (
            <button key={d} onClick={() => setDifficultyFilter(d)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                difficultyFilter === d ? "bg-gray-700 text-white" : "bg-white text-gray-400 border border-gray-200"}`}>
              {d === "all" ? "全部难度" : d}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-gray-400 self-center">{filtered.length} 个动作</span>
        </div>

        {activeCategory !== "all" && (
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryMeta[activeCategory].icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-800">{categoryMeta[activeCategory].label}</p>
                <p className="text-xs text-gray-500">{categoryMeta[activeCategory].desc}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-400 text-sm">没有找到匹配的动作</p>
            </div>
          ) : (
            filtered.map((ex, i) => (
              <button key={i} onClick={() => setSelectedExercise(ex)}
                className="w-full text-left bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{ex.icon || "💪"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-amber-600 transition-colors">{ex.name}</span>
                      {ex.difficulty && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${difficultyBadge[ex.difficulty] || "bg-gray-100 text-gray-500"}`}>{ex.difficulty}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{ex.sets}组 × {ex.reps}{ex.reps > 20 ? "秒" : "次"}</span>
                      {ex.target && <span>🎯 {ex.target}</span>}
                      <span>⏱ 休{ex.rest}s</span>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-amber-400 transition-colors">→</span>
                </div>
              </button>
            ))
          )}
        </div>

        {selectedExercise && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedExercise(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedExercise.icon || "💪"}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedExercise.name}</h3>
                    {selectedExercise.target && <p className="text-xs text-gray-400">🎯 {selectedExercise.target}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedExercise(null)} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
              </div>
              {selectedExercise.difficulty && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-4 ${difficultyBadge[selectedExercise.difficulty] || "bg-gray-100 text-gray-500"}`}>
                  {selectedExercise.difficulty}
                </span>
              )}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-amber-600">{selectedExercise.sets}</div>
                  <div className="text-[10px] text-amber-500">组数</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-emerald-600">{selectedExercise.reps}</div>
                  <div className="text-[10px] text-emerald-500">{selectedExercise.reps > 20 ? "秒" : "次"}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-blue-600">{selectedExercise.rest}s</div>
                  <div className="text-[10px] text-blue-500">间歇</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">💡 动作要点</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedExercise.notes}</p>
              </div>
              <button onClick={() => setSelectedExercise(null)}
                className="w-full mt-4 py-2.5 bg-amber-400 text-white rounded-full text-sm font-medium hover:bg-amber-500 transition-colors">
                知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercises;
