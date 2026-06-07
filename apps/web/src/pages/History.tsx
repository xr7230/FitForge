import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface HistoryItem { id: number; date: string; feedback: string; notes: string | null; createdAt: string; }
interface Stats { completed: number; tooHard: number; tooEasy: number; totalDays: number; streak: number; weekDays: number; }

const feedbackEmoji: Record<string, string> = { "完成": "✅", "部分完成": "🟡", "太难": "😰", "太简单": "😎" };
const feedbackLabel: Record<string, string> = { "完成": "完成", "部分完成": "部分完成", "太难": "太难了", "太简单": "太简单" };

function getFeedbackColor(feedback: string): string {
  if (feedback === "完成") return "bg-emerald-400";
  if (feedback === "部分完成") return "bg-amber-400";
  if (feedback === "太难") return "bg-orange-400";
  if (feedback === "太简单") return "bg-blue-400";
  return "bg-gray-200";
}

const History: React.FC = () => {
  const [heatmap, setHeatmap] = useState<Record<string, string>>({});
  const [list, setList] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/history?year=${viewYear}&month=${viewMonth}`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(data => {
        setHeatmap(data.heatmap || {});
        setList(data.list || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [viewYear, viewMonth]);

  const saveNote = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ notes: noteText }),
    });
    setEditingNote(null);
    setList(prev => prev.map(item => item.id === id ? { ...item, notes: noteText } : item));
  };

  // 生成该月的日历格子
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

  // 近3个月标签
  const monthLabels: { y: number; m: number; label: string }[] = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: `${d.getMonth() + 1}月` });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        {/* 标题 */}
        <h2 className="text-lg font-bold text-gray-800 mb-6">📊 训练记录</h2>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: "总训练", value: stats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "连续天", value: stats.streak, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "本周", value: stats.weekDays, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "训练日", value: stats.totalDays, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-extrabold ${item.color}`}>{item.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 月选择器 */}
        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1">
          {monthLabels.map(m => (
            <button
              key={`${m.y}-${m.m}`}
              onClick={() => { setViewYear(m.y); setViewMonth(m.m); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                viewYear === m.y && viewMonth === m.m
                  ? "bg-amber-400 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-amber-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 日历热力图 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">{viewMonth}月</h3>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-400" /> 完成
              <span className="w-3 h-3 rounded-sm bg-amber-400" /> 部分
              <span className="w-3 h-3 rounded-sm bg-gray-200" /> 未练
            </div>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["日", "一", "二", "三", "四", "五", "六"].map(d => (
              <div key={d} className="text-center text-[9px] text-gray-300 py-0.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const fb = heatmap[dateStr];
              const isToday = dateStr === today;
              return (
                <div
                  key={day}
                  title={`${dateStr}: ${fb ? feedbackLabel[fb] || fb : "未训练"}`}
                  className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                    fb ? getFeedbackColor(fb) + " text-white shadow-sm" : "bg-gray-100 text-gray-300"
                  } ${isToday ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* 训练列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-800 px-5 pt-4 pb-3">训练记录</h3>
          {list.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">🏋️</p>
              <p className="text-gray-400 text-sm">这个月还没有训练记录</p>
              <button onClick={() => navigate("/plan")} className="mt-2 text-amber-600 text-sm hover:underline">去训练</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {list.map((item) => (
                <div key={item.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{feedbackEmoji[item.feedback] || "❓"}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{feedbackLabel[item.feedback] || item.feedback}</p>
                        <p className="text-[10px] text-gray-400">{item.date}</p>
                        {editingNote === item.id ? (
                          <div className="mt-1.5 flex gap-2">
                            <input autoFocus value={noteText} onChange={e => setNoteText(e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-200 rounded-md w-40 focus:outline-none focus:ring-1 focus:ring-amber-300" />
                            <button onClick={() => saveNote(item.id)} className="text-xs text-amber-600 font-medium">保存</button>
                            <button onClick={() => setEditingNote(null)} className="text-xs text-gray-400">取消</button>
                          </div>
                        ) : item.notes ? (
                          <p className="text-xs text-gray-500 mt-1 italic">📝 {item.notes}</p>
                        ) : null}
                      </div>
                    </div>
                    <button onClick={() => { setEditingNote(item.id); setNoteText(item.notes || ""); }}
                      className="text-[10px] text-gray-300 hover:text-amber-500 transition-colors shrink-0">
                      {item.notes ? "✏️" : "+ 笔记"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
