import React, { useState, useEffect } from "react";
import { useToast } from "../components/ToastContext";

interface Goal {
  id: number; title: string; goal_type: string;
  target_value: number; current_value: number; unit: string;
  deadline: string | null; achieved: number; created_at: string;
}

const goalTypeMeta: Record<string, { icon: string; label: string; color: string }> = {
  weight: { icon: "⚖️", label: "体重目标", color: "text-amber-600" },
  workout_frequency: { icon: "📅", label: "训练频率", color: "text-blue-600" },
  strength: { icon: "💪", label: "力量目标", color: "text-red-600" },
  endurance: { icon: "🏃", label: "耐力目标", color: "text-emerald-600" },
  habit: { icon: "🌱", label: "习惯养成", color: "text-purple-600" },
  custom: { icon: "🎯", label: "自定义", color: "text-gray-600" },
};

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("weight");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("0");
  const [unit, setUnit] = useState("kg");
  const [deadline, setDeadline] = useState("");

  const fetchGoals = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setGoals(data.goals || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          title, goalType, targetValue: parseFloat(targetValue),
          currentValue: parseFloat(currentValue) || 0, unit, deadline: deadline || null,
        }),
      });
      if (res.ok) {
        showToast("目标已创建！", "success");
        setShowForm(false);
        setTitle(""); setTargetValue(""); setCurrentValue("0"); setUnit("kg"); setDeadline("");
        fetchGoals();
      } else {
        showToast("创建失败", "error");
      }
    } catch { showToast("网络错误", "error"); }
  };

  const handleUpdateProgress = async (id: number, newValue: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ currentValue: newValue }),
      });
      fetchGoals();
      showToast("进度已更新", "success");
    } catch { showToast("更新失败", "error"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这个目标？")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    fetchGoals();
    showToast("目标已删除", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">🎯 目标</h2>
            <p className="text-xs text-gray-400">{activeGoals.length} 个进行中 · {achievedGoals.length} 个已达成</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-amber-400 text-white hover:bg-amber-500 transition-colors">
            {showForm ? "取消" : "+ 新目标"}
          </button>
        </div>

        {/* 创建表单 */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">设定新目标</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">目标名称</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="例：减重到60kg" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">类型</label>
                  <select value={goalType} onChange={e => { setGoalType(e.target.value); setUnit(e.target.value === "weight" ? "kg" : e.target.value === "endurance" ? "分钟" : e.target.value === "workout_frequency" ? "次/周" : ""); }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300">
                    {Object.entries(goalTypeMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">目标值</label>
                  <input type="number" step="0.1" required value={targetValue} onChange={e => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">当前值</label>
                  <input type="number" step="0.1" value={currentValue} onChange={e => setCurrentValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">单位</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)}
                    placeholder="kg" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">截止日期（可选）</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 text-white text-sm font-medium hover:bg-amber-500 transition-colors">
                创建目标
              </button>
            </div>
          </form>
        )}

        {/* 进行中的目标 */}
        {activeGoals.length === 0 && achievedGoals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-500 text-sm mb-4">还没有设定目标</p>
            <p className="text-xs text-gray-400">设定一个目标，让小铁陪你一起达成</p>
          </div>
        ) : (
          <>
            {activeGoals.map(goal => {
              const progress = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
              const meta = goalTypeMeta[goal.goal_type] || goalTypeMeta.custom;
              const isWeightGoal = goal.goal_type === "weight";
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{goal.title}</p>
                        <p className="text-[10px] text-gray-400">{meta.label}{goal.deadline ? ` · 截止 ${goal.deadline}` : ""}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(goal.id)}
                      className="text-gray-300 hover:text-red-400 text-xs transition-colors">删除</button>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isWeightGoal ? "bg-emerald-400" : "bg-amber-400"}`}
                        style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => {
                      const v = prompt("更新当前进度", String(goal.current_value));
                      if (v && !isNaN(Number(v))) handleUpdateProgress(goal.id, Number(v));
                    }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                      ✏️ 更新进度
                    </button>
                    <button onClick={() => handleUpdateProgress(goal.id, goal.target_value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      ✅ 达成
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* 已达成目标 */}
        {achievedGoals.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🏆 已达成 ({achievedGoals.length})</h3>
            <div className="space-y-2">
              {achievedGoals.map(goal => {
                const meta = goalTypeMeta[goal.goal_type] || goalTypeMeta.custom;
                return (
                  <div key={goal.id} className="bg-white rounded-xl p-3 border border-emerald-100 opacity-70 flex items-center gap-3">
                    <span className="text-lg">{meta.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 line-through">{goal.title}</p>
                      <p className="text-[10px] text-emerald-500">{goal.target_value} {goal.unit} · 已达成 ✨</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
