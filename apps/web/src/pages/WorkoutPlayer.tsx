import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Exercise {
  name: string; sets: number; reps: number; rest: number; notes: string; target?: string; icon?: string;
}

interface WorkoutData {
  day: number; warmup: string[]; main: string[]; coolDown: string[]; exercises?: Exercise[];
}

interface SavedSession {
  weekNum: number; dayNum: number;
  phase: string; currentExerciseIdx: number; currentSet: number; totalCompleted: number;
  savedAt: string;
}

const buddyMessages = {
  warmup: ['慢慢来，把身体热开 🔥', '热身很重要，别跳过哦～', '活动一下关节，感觉怎么样？'],
  main: ['加油，你可以的 💪', '专注动作，别想别的', '做得很好，继续保持', '呼吸别憋着，自然就好', '又完成一组，真棒 👏'],
  rest: ['喘口气，喝点水 🥤', '休息一下，下组继续', '感觉还行吗？不用急'],
  cooldown: ['放松下来，身体需要这个', '拉伸的时候深呼吸 🧘', '今天的你很了不起'],
};

function buddySay(category: keyof typeof buddyMessages): string {
  const msgs = buddyMessages[category];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

const SESSION_KEY = 'fitforge_session';

function saveSession(data: SavedSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
}

function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedSession;
    const age = Date.now() - new Date(data.savedAt).getTime();
    if (age > 4 * 60 * 60 * 1000) { localStorage.removeItem(SESSION_KEY); return null; }
    return data;
  } catch { return null; }
}

function clearSession() { localStorage.removeItem(SESSION_KEY); }

const WorkoutPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [resumeData, setResumeData] = useState<SavedSession | null>(null);

  const [phase, setPhase] = useState<'warmup' | 'main' | 'cooldown' | 'complete'>('warmup');
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [journalNote, setJournalNote] = useState('');
  const [buddyMsg, setBuddyMsg] = useState('准备好了吗？');

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exercises = workout?.exercises || [];
  const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);
  const currentExercise = exercises[currentExerciseIdx] || null;
  const weekNum = Number(id?.split('-')[0]) || 1;
  const dayNum = Number(id?.split('-')[1]) || 1;

  useEffect(() => {
    const fetchWorkout = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setError('请先登录'); setLoading(false); return; }
      try {
        const plansRes = await fetch(`${import.meta.env.VITE_API_URL}/api/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!plansRes.ok) throw new Error('获取计划失败');
        const { plans } = await plansRes.json();
        if (!plans?.length) { setError('没有训练计划'); setLoading(false); return; }
        const planData = typeof plans[0].plan_data === 'string' ? JSON.parse(plans[0].plan_data) : plans[0].plan_data;
        const week = planData.weeks?.find((w: any) => w.week === weekNum);
        const w = week?.workouts?.find((wo: any) => wo.day === dayNum);
        if (!w) { setError('未找到该日训练'); setLoading(false); return; }
        setWorkout(w);
        const saved = loadSession();
        if (saved && saved.weekNum === weekNum && saved.dayNum === dayNum && saved.phase !== 'complete') {
          setResumeData(saved);
          setShowResume(true);
        }
        setLoading(false);
      } catch { setError('加载失败'); setLoading(false); }
    };
    fetchWorkout();
  }, [id]);

  useEffect(() => {
    if (phase === 'main' && workout) {
      saveSession({ weekNum, dayNum, phase, currentExerciseIdx, currentSet, totalCompleted, savedAt: new Date().toISOString() });
    }
  }, [phase, currentExerciseIdx, currentSet, totalCompleted]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const resumeFromSession = useCallback(() => {
    if (!resumeData) return;
    setPhase(resumeData.phase as any);
    setCurrentExerciseIdx(resumeData.currentExerciseIdx);
    setCurrentSet(resumeData.currentSet);
    setTotalCompleted(resumeData.totalCompleted);
    setShowResume(false);
    setBuddyMsg('继续刚才的训练吧 💪');
  }, [resumeData]);

  const startExercise = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setTimer(currentExercise?.reps || 30);
    setBuddyMsg(buddySay('main'));
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          advanceProgress();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentExercise]);

  const advanceProgress = useCallback(() => {
    if (!currentExercise) return;
    if (currentSet < currentExercise.sets) {
      setCurrentSet(prev => prev + 1);
      setTotalCompleted(prev => prev + 1);
      setIsResting(true);
      setTimer(currentExercise.rest);
      setBuddyMsg(buddySay('rest'));
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsResting(false);
            setBuddyMsg(buddySay('main'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTotalCompleted(prev => prev + 1);
      if (currentExerciseIdx + 1 < exercises.length) {
        setCurrentExerciseIdx(prev => prev + 1);
        setCurrentSet(1);
        setIsRunning(false);
        setIsResting(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setBuddyMsg(buddySay('main'));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('cooldown');
        setBuddyMsg(buddySay('cooldown'));
        setIsRunning(false);
        setIsResting(false);
      }
    }
  }, [currentExercise, currentExerciseIdx, currentSet, exercises]);

  const finishEarly = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    if (totalCompleted > 0) {
      setPhase('complete');
    } else {
      navigate('/plan');
    }
  }, [totalCompleted, navigate]);

  const submitFinalFeedback = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    clearSession();
    await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        workoutDate: new Date().toISOString().split('T')[0],
        feedback: totalCompleted >= totalSets ? '完成' : '部分完成',
        notes: journalNote,
      }),
    });
    navigate('/dashboard');
  }, [totalCompleted, totalSets, journalNote, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => navigate('/plan')} className="text-amber-600 hover:underline">返回</button>
        </div>
      </div>
    );
  }

  if (showResume && resumeData) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">💪</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">发现未完成的训练</h2>
          <p className="text-gray-500 text-sm mb-2">
            第 {resumeData.weekNum} 周 · 第 {resumeData.dayNum} 天
          </p>
          <p className="text-gray-400 text-xs mb-6">
            已完成 {resumeData.totalCompleted}/{totalSets} 组
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={resumeFromSession}
              className="px-6 py-3 bg-amber-400 text-white rounded-full font-medium text-sm hover:bg-amber-500 transition-colors">
              继续训练
            </button>
            <button onClick={() => { clearSession(); setShowResume(false); }}
              className="px-6 py-3 bg-white text-gray-500 rounded-full font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'warmup') {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6">🔥</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">热身准备</h2>
        <div className="space-y-3 mb-8 text-center">
          {workout?.warmup.map((item: string, i: number) => (
            <p key={i} className="text-sm text-gray-600">· {item}</p>
          ))}
        </div>
        <button onClick={() => { setPhase('main'); setBuddyMsg(buddySay('main')); }}
          className="px-10 py-3 bg-amber-400 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-colors">
          热身完成，开始训练
        </button>
      </div>
    );
  }

  if (phase === 'cooldown') {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6">🧘</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">放松拉伸</h2>
        <div className="space-y-3 mb-8 text-center">
          {workout?.coolDown.map((item: string, i: number) => (
            <p key={i} className="text-sm text-gray-600">· {item}</p>
          ))}
        </div>
        <button onClick={() => { setPhase('complete'); setBuddyMsg('训练完成！你真棒 🎉'); }}
          className="px-10 py-3 bg-emerald-400 text-white rounded-full font-bold text-sm hover:bg-emerald-500 transition-colors">
          拉伸完成
        </button>
      </div>
    );
  }

  if (phase === 'complete') {
    const isPartial = totalCompleted < totalSets;
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6">{isPartial ? '🟡' : '🎉'}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isPartial ? '训练部分完成' : '训练完成！'}
        </h2>
        <p className="text-gray-500 text-sm mb-1">
          完成 {totalCompleted}/{totalSets} 组
        </p>
        <p className="text-gray-400 text-xs mb-6">
          {isPartial ? '没关系，能做到的已经非常棒了 💪' : '今天的你，又比昨天强了一点'}
        </p>
        <textarea value={journalNote} onChange={e => setJournalNote(e.target.value)}
          placeholder="训练笔记...（选填）"
          className="w-full max-w-xs px-3 py-2 text-xs border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none h-16" />
        <button onClick={submitFinalFeedback}
          className="w-full max-w-xs py-3 bg-amber-400 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-colors">
          完成
        </button>
      </div>
    );
  }

  // 计算进度
  const progress = totalSets > 0 ? Math.round((totalCompleted / totalSets) * 100) : 0;

  // 主训练
  return (
    <div className={`min-h-screen flex flex-col ${isResting ? 'bg-[#f5f0e8]' : 'bg-[#faf9f6]'}`}>
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-amber-400 transition-all duration-500 rounded-r" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-lg">💪</span>
        <p className="text-xs text-gray-500">{buddyMsg}</p>
        <div className="ml-auto text-[10px] text-gray-400">
          {currentExerciseIdx + 1}/{exercises.length} · {totalCompleted}/{totalSets}组
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isResting ? (
          <>
            <p className="text-amber-600 text-sm font-medium mb-6">休息一下</p>
            <div className="text-8xl font-extrabold text-gray-800 mb-4 tabular-nums">{timer}</div>
            <p className="text-gray-400 text-sm mb-8">秒后继续 · {currentExercise?.name}</p>
            <div className="flex gap-3">
              <button onClick={() => { setIsResting(false); setBuddyMsg(buddySay('main')); setTimer(currentExercise?.reps || 30); }}
                className="px-6 py-3 bg-amber-400 text-white rounded-full font-medium text-sm hover:bg-amber-500 transition-colors">
                开始下一组
              </button>
              <button onClick={() => setIsPaused(p => !p)}
                className="px-6 py-3 bg-white text-gray-600 rounded-full font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                {isPaused ? '继续' : '暂停'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">{currentExercise?.icon || '💪'}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{currentExercise?.name}</h2>
            {currentExercise?.target && (
              <span className="text-xs text-gray-400 mb-6">{currentExercise.target}</span>
            )}

            <div className="flex gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-gray-800">{currentExercise?.sets}</div>
                <div className="text-[10px] text-gray-400">组</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-amber-500">{currentExercise?.reps}</div>
                <div className="text-[10px] text-gray-400">{currentExercise?.reps && currentExercise.reps > 20 ? '秒' : '次'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-gray-800">{currentSet}/{currentExercise?.sets}</div>
                <div className="text-[10px] text-gray-400">当前</div>
              </div>
            </div>

            {isRunning ? (
              <div className="mb-6">
                <div className="text-7xl font-extrabold text-gray-800 tabular-nums">{timer}</div>
                <div className="text-center text-sm text-gray-400 mt-1">秒</div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="text-5xl font-extrabold text-gray-300">{currentExercise?.reps}</div>
                <div className="text-center text-sm text-gray-300 mt-1">秒</div>
              </div>
            )}

            {currentExercise?.notes && (
              <p className="text-gray-400 text-xs text-center mb-8 max-w-xs">💡 {currentExercise.notes}</p>
            )}

            <div className="flex gap-3 w-full max-w-xs">
              {!isRunning ? (
                <button onClick={startExercise}
                  className="flex-1 py-3 bg-amber-400 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-colors">
                  开始
                </button>
              ) : (
                <button onClick={() => setIsPaused(p => !p)}
                  className="flex-1 py-3 bg-white text-gray-600 rounded-full font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                  {isPaused ? '继续' : '暂停'}
                </button>
              )}
            </div>
          </>
        )}

        <div className="mt-8 flex gap-6">
          <button onClick={() => { if (confirm('确定退出训练吗？进度已自动保存')) navigate('/plan'); }}
            className="text-gray-300 text-xs hover:text-gray-500 transition-colors">
            退出（已保存）
          </button>
          <button onClick={finishEarly}
            className="text-gray-300 text-xs hover:text-amber-500 transition-colors">
            练不动了
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlayer;
