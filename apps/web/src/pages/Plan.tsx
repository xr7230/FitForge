import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkoutPlan {
  id: number; user_id: number;
  plan_data: {
    weeks: { week: number; focus: string; workouts: { day: number; warmup: string[]; main: string[]; coolDown: string[]; exercises?: any[] }[] }[];
    summary: { weeklyDays: number; sessionDuration: number; primaryType: string; level: string; focusAreas: string[] };
  };
  start_date: string; end_date: string;
}

const Plan: React.FC = () => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [feedbackBias, setFeedbackBias] = useState(0);
  const navigate = useNavigate();

  const fetchPlans = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setError('请先登录'); setLoading(false); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      const parsed = (data.plans || []).map((p: any) => ({
        ...p, plan_data: typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data,
      }));
      setPlans(parsed);
      if (parsed.length > 0) setActivePlan(parsed[0]);
    } catch { setError('加载失败，请确认已完成评估和画像'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setGenerating(true); setError(''); setFeedbackBias(0);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setGenerating(false); return; }
      if (data.feedbackBias) setFeedbackBias(data.feedbackBias);
      await fetchPlans();
    } catch { setError('网络错误'); }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">还没有训练计划</h2>
          <p className="text-gray-500 text-sm mb-6">先完成评估，小铁帮你定制专属计划</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/assessment')}
              className="px-5 py-2.5 bg-white text-gray-600 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50">去评估</button>
            <button onClick={handleGenerate} disabled={generating}
              className={`px-5 py-2.5 rounded-full text-sm font-medium text-white ${generating ? 'bg-gray-300' : 'bg-amber-400 hover:bg-amber-500'}`}>
              {generating ? '生成中...' : '生成计划'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { plan_data } = activePlan;
  const s = plan_data.summary;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-800">训练计划</h2>
            <button onClick={handleGenerate} disabled={generating}
              className={`text-xs px-3 py-1 rounded-full ${generating ? 'text-gray-300' : 'text-amber-600 hover:bg-amber-50'}`}>
              {generating ? '...' : '🔄 重新生成'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {activePlan.start_date?.split('T')[0]} — {activePlan.end_date?.split('T')[0]}
          </p>
          {s && (
            <div className="flex gap-3 mt-3 text-xs text-gray-500">
              <span>{s.weeklyDays}天/周</span><span>·</span>
              <span>{s.sessionDuration}分钟</span><span>·</span>
              <span>{s.primaryType}</span><span>·</span>
              <span>{s.level}</span>
            </div>
          )}
          {s?.focusAreas && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {s.focusAreas.map((a, i) => (
                <span key={i} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">🎯 {a}</span>
              ))}
            </div>
          )}

          {/* 反馈调整提示 */}
          {feedbackBias !== 0 && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              💪 小铁根据你最近的训练反馈，{feedbackBias > 0 ? '提高了' : '降低了'}训练强度
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {plans.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {plans.map((p, i) => (
              <button key={p.id} onClick={() => setActivePlan(p)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${activePlan.id === p.id ? 'bg-amber-400 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                计划 {plans.length - i}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-5">
          {plan_data.weeks.map(week => (
            <div key={week.week} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-50/50 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">第 {week.week} 周</span>
                <span className="text-[11px] text-gray-400">{week.focus}</span>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {week.workouts.map(w => (
                  <button key={w.day}
                    onClick={() => navigate(`/play/${week.week}-${w.day}`)}
                    className="text-left p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">第 {w.day} 天</span>
                      <span className="text-amber-400 opacity-0 group-hover:opacity-100 text-[10px]">▶</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{w.main?.[0] || '训练日'}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{w.exercises?.length || 0} 个动作</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plan;
