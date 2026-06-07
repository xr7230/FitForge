import React, { useState, useEffect } from "react";

interface Measurement {
  id: number; measurement_date: string;
  weight: number | null; waist: number | null; chest: number | null;
  arm: number | null; thigh: number | null; notes: string | null;
}

const fieldConfig: { key: keyof Measurement; label: string; unit: string; icon: string; color: string }[] = [
  { key: "weight", label: "体重", unit: "kg", icon: "⚖️", color: "#f59e0b" },
  { key: "waist", label: "腰围", unit: "cm", icon: "📏", color: "#10b981" },
  { key: "chest", label: "胸围", unit: "cm", icon: "💪", color: "#3b82f6" },
  { key: "arm", label: "臂围", unit: "cm", icon: "🦾", color: "#8b5cf6" },
  { key: "thigh", label: "腿围", unit: "cm", icon: "🦵", color: "#ec4899" },
];

const Measurements: React.FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"记录" | "记录列表">("记录");

  // 表单
  const [form, setForm] = useState({ weight: "", waist: "", chest: "", arm: "", thigh: "", notes: "" });
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/measurements`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setMeasurements(data.measurements || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const body: any = {};
      if (form.weight) body.weight = parseFloat(form.weight);
      if (form.waist) body.waist = parseFloat(form.waist);
      if (form.chest) body.chest = parseFloat(form.chest);
      if (form.arm) body.arm = parseFloat(form.arm);
      if (form.thigh) body.thigh = parseFloat(form.thigh);
      if (form.notes) body.notes = form.notes;
      if (Object.keys(body).length === 0) { setMsg("至少填一项数据"); setSaving(false); return; }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setForm({ weight: "", waist: "", chest: "", arm: "", thigh: "", notes: "" });
        setMsg("保存成功 ✅");
        fetchData();
      } else {
        setMsg("保存失败");
      }
    } catch { setMsg("网络错误"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token || !confirm("确定删除这条记录？")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/api/measurements/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const hasTrend = measurements.filter(m => m.weight).length >= 2;

  // SVG 趋势图参数
  const chartW = 320, chartH = 140, padL = 40, padR = 16, padT = 12, padB = 24;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;

  // 生成体重趋势 SVG path
  const renderWeightChart = () => {
    const points = measurements.filter(m => m.weight);
    if (points.length < 2) return null;
    const weights = points.map(p => p.weight!);
    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);
    const range = maxW - minW || 1;
    const stepX = plotW / (points.length - 1);
    let pathD = "";
    points.forEach((p, i) => {
      const x = padL + i * stepX;
      const y = padT + plotH - ((p.weight! - minW) / range) * plotH;
      pathD += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
    });
    const trend = points[points.length - 1].weight! - points[0].weight!;
    const trendStr = trend > 0 ? "↑+" + trend.toFixed(1) : trend < 0 ? "↓" + trend.toFixed(1) : "→ 持平";
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">体重趋势</span>
          <span className={`text-xs font-bold ${trend > 0 ? "text-red-500" : trend < 0 ? "text-emerald-500" : "text-gray-400"}`}>{trendStr} kg</span>
        </div>
        <svg viewBox={"0 0 " + chartW + " " + chartH} className="w-full" style={{ maxHeight: 160 }}>
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = padT + plotH * f;
            const label = (maxW - (maxW - minW) * f).toFixed(1);
            return (
              <g key={f}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={padL - 4} y={y + 4} textAnchor="end" className="text-[9px]" fill="#9ca3af">{label}</text>
              </g>
            );
          })}
          {/* 填充区域 */}
          <path d={pathD + "L" + (padL + (points.length - 1) * stepX).toFixed(1) + "," + (padT + plotH) + " L" + padL.toFixed(1) + "," + (padT + plotH) + " Z"}
            fill="url(#weightGrad)" opacity={0.3} />
          {/* 线条 */}
          <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* 数据点 */}
          {points.map((p, i) => (
            <circle key={i} cx={padL + i * stepX} cy={padT + plotH - ((p.weight! - minW) / range) * plotH}
              r={3} fill="#f59e0b" stroke="white" strokeWidth={2} />
          ))}
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-6">📏 身体数据</h2>

        {/* Tab 切换 */}
        <div className="flex bg-white rounded-full p-1 mb-6 border border-gray-100">
          {(["记录", "记录列表"] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={"flex-1 py-2 rounded-full text-xs font-medium transition-all " +
                (activeTab === tab ? "bg-amber-400 text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "记录" ? (
          <>
            {/* 最新数据概览 */}
            {latest && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3">📋 最新记录 · {latest.measurement_date}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {fieldConfig.map(f => (
                    latest[f.key] ? (
                      <div key={f.key} className="text-center">
                        <div className="text-xl font-extrabold" style={{ color: f.color }}>{latest[f.key]}</div>
                        <div className="text-[10px] text-gray-400">{f.label} ({f.unit})</div>
                      </div>
                    ) : null
                  ))}
                </div>
                {latest.notes && <p className="text-xs text-gray-400 mt-3">💬 {latest.notes}</p>}
                {hasTrend && renderWeightChart()}
              </div>
            )}

            {/* 记录表单 */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-4">✏️ 记录新数据</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {fieldConfig.map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-gray-500 mb-1 block">{f.icon} {f.label} ({f.unit})</label>
                    <input type="number" step="0.1" value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.label}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent" />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="text-[11px] text-gray-500 mb-1 block">💬 备注</label>
                <input type="text" value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="今天感觉怎么样？"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent" />
              </div>
              {msg && <p className={"text-xs mb-3 " + (msg.includes("成功") ? "text-emerald-600" : "text-red-500")}>{msg}</p>}
              <button type="submit" disabled={saving}
                className={"w-full py-2.5 rounded-full text-sm font-medium text-white transition-colors " +
                  (saving ? "bg-gray-300" : "bg-amber-400 hover:bg-amber-500")}>
                {saving ? "保存中..." : "保存"}
              </button>
            </form>
          </>
        ) : (
          /* 历史列表 */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {measurements.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-3xl mb-2">📏</p>
                <p className="text-gray-400 text-sm">还没有记录过身体数据</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {measurements.slice().reverse().map(m => (
                  <div key={m.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">{m.measurement_date}</span>
                      <button onClick={() => handleDelete(m.id)}
                        className="text-[10px] text-gray-300 hover:text-red-400 transition-colors">删除</button>
                    </div>
                    <div className="flex gap-3 text-xs">
                      {fieldConfig.map(f => m[f.key] ? (
                        <span key={f.key} className="text-gray-600">{f.icon} {m[f.key]}{f.unit}</span>
                      ) : null)}
                    </div>
                    {m.notes && <p className="text-[10px] text-gray-400 mt-1">{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Measurements;
