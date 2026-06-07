import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Exercise { name: string; sets: number; reps: number; rest: number; notes: string; icon?: string; target?: string; }

const WorkoutDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('完成');
  const [fbOk, setFbOk] = useState(false);
  const [note, setNote] = useState('');

  const weekNum = Number(id?.split('-')[0]) || 1;
  const dayNum = Number(id?.split('-')[1]) || 1;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('请先登录'); setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/plan`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ plans }) => {
        if (!plans?.length) throw new Error('无计划');
        const d = typeof plans[0].plan_data === 'string' ? JSON.parse(plans[0].plan_data) : plans[0].plan_data;
        const wk = d.weeks?.find((w: any) => w.week === weekNum);
        const wd = wk?.workouts?.find((w: any) => w.day === dayNum);
        if (!wd) throw new Error('未找到');
        setWorkout(wd);
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitFeedback = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ workoutDate: new Date().toISOString().split('T')[0], feedback, notes: note }),
    });
    setFbOk(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (error || !workout) {
    return <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => navigate('/plan')} className="text-amber-600 hover:underline">返回</button></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-1">训练详情</h2>
        <p className="text-sm text-gray-400 mb-6">第 {weekNum} 周 · 第 {dayNum} 天</p>

        <div className="space-y-4">
          <Section title="🏃 热身" items={workout.warmup} />
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3">🔥 主训练</h3>
            <div className="flex gap-1 flex-wrap mb-3">
              {workout.main.map((m: string, i: number) => (
                <span key={i} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{m}</span>
              ))}
            </div>
            {workout.exercises?.map((ex: Exercise, i: number) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span>{ex.icon || '💪'}</span>
                  <span className="text-sm font-bold text-gray-800">{ex.name}</span>
                  {ex.target && <span className="text-[10px] text-gray-400">{ex.target}</span>}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{ex.sets} 组</span><span>{ex.reps} {ex.reps > 20 ? '秒' : '次'}</span><span>休 {ex.rest}s</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">💡 {ex.notes}</p>
              </div>
            ))}
          </div>
          <Section title="🧘 放松" items={workout.coolDown} />

          {!fbOk && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">训练感受</h3>
              <div className="flex gap-3 mb-3">
                {['完成', '太难', '太简单'].map(o => (
                  <label key={o} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={feedback === o} onChange={() => setFeedback(o)}
                      className="text-amber-500" /><span className="text-sm text-gray-600">{o}</span>
                  </label>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder='训练笔记...（选填）'
                className='w-full px-3 py-2 text-xs border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none h-16' />
              <button onClick={submitFeedback}
                className="w-full py-2.5 bg-amber-400 text-white rounded-full text-sm font-medium hover:bg-amber-500">提交</button>
            </div>
          )}
          {fbOk && <p className="text-green-600 text-sm text-center">反馈已提交 ✅</p>}
        </div>
      </div>
    </div>
  );
};

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
      {items.map((item, i) => (
        <p key={i} className="text-sm text-gray-600 py-1">· {item}</p>
      ))}
    </div>
  );
}

export default WorkoutDetail;
