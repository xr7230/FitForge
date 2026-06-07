import React, { useState, useEffect } from "react";

interface WeeklyReport {
  week: { start: string; end: string };
  stats: {
    completed: number; partial: number; total: number;
    totalDays: number; streak: number; weightChange: number | null;
  };
  summary: string;
  recentDates: string[];
  feedbacks: { feedback: string; workout_date: string; notes: string | null }[];
}

const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

const Report: React.FC = () => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/report`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-gray-400 text-sm">暂无报告数据</p>
        </div>
      </div>
    );
  }

  const { stats, summary } = report;
  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(report.week.start);
  const weekDays: { date: string; label: string; isToday: boolean; trained: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    weekDays.push({
      date: dateStr,
      label: dayNames[d.getDay()],
      isToday: dateStr === today,
      trained: report.recentDates.includes(dateStr),
    });
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-1">📊 周报</h2>
        <p className="text-xs text-gray-400 mb-6">
          {report.week.start} ~ {report.week.end}
        </p>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-xl">💪</span>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">小铁的周总结</p>
              <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "完成训练", value: stats.completed, icon: "✅", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "部分完成", value: stats.partial, icon: "🟡", color: "text-amber-600", bg: "bg-amber-50" },
            { label: "连续天数", value: stats.streak, icon: "🔥", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "总训练日", value: stats.totalDays, icon: "📅", color: "text-purple-600", bg: "bg-purple-50" },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span>{item.icon}</span>
                <span className="text-[10px] text-gray-500">{item.label}</span>
              </div>
              <div className={`text-2xl font-extrabold ${item.color}`}>{item.value}</div>
            </div>
          ))}
          {stats.weightChange !== null && (
            <div className={`rounded-xl p-4 col-span-2 ${stats.weightChange > 0 ? "bg-red-50" : stats.weightChange < 0 ? "bg-emerald-50" : "bg-gray-50"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span>⚖️</span>
                <span className="text-[10px] text-gray-500">体重变化</span>
              </div>
              <div className={`text-2xl font-extrabold ${stats.weightChange > 0 ? "text-red-500" : stats.weightChange < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                {stats.weightChange > 0 ? "+" : ""}{stats.weightChange} kg
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">本周打卡</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(d => (
              <div key={d.date} className="text-center">
                <div className="text-[10px] text-gray-400 mb-1">{d.label}</div>
                <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  d.trained
                    ? "bg-emerald-400 text-white shadow-sm"
                    : d.isToday
                    ? "bg-amber-100 text-amber-600 ring-2 ring-amber-400"
                    : "bg-gray-100 text-gray-300"
                }`}>
                  {d.trained ? "✓" : new Date(d.date).getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {report.feedbacks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-800 px-5 pt-4 pb-3">训练详情</h3>
            <div className="divide-y divide-gray-50">
              {report.feedbacks.map((fb, i) => {
                const emojiMap: Record<string, string> = { "完成": "✅", "部分完成": "🟡", "太难": "😰", "太简单": "😎" };
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <span>{emojiMap[fb.feedback] || "❓"}</span>
                    <div>
                      <p className="text-sm text-gray-700">{fb.feedback}</p>
                      <p className="text-[10px] text-gray-400">{fb.workout_date}</p>
                    </div>
                    {fb.notes && <p className="ml-auto text-[10px] text-gray-400 italic">📝 {fb.notes}</p>}
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

export default Report;
