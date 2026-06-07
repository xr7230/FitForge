import React, { useState, useEffect } from 'react';
import { DashboardSkeleton } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';

interface DashData {
  streak: number; totalWorkouts: number; weekWorkouts: number;
  hasPlan: boolean; plan: any; profile: any;
  todayCompleted: boolean; todayWorkout: any;
  feedbackBias: number; suggestion: string;
}

const greetings: Record<string, string[]> = {
  morning: ['早上好！今天感觉充满电了吗？', '新的一天，一起动起来吧 ☀️', '早安～先活动一下唤醒身体？'],
  afternoon: ['下午好！来一场提神的训练？', '午饭消化得差不多了，动一动？', '下午来组训练，晚上睡得香 💤'],
  evening: ['晚上好～今天有好好对待自己的身体吗？', '睡前轻量运动，帮身体放松下来', '一天辛苦了，来个舒缓的拉伸吧'],
  night: ['这么晚还在努力，真棒 👏', '夜深了，轻松动一动就好', '别太拼，身体需要温柔的对待'],
};

const restDayTips = [
  { emoji: "🧘", title: "恢复拉伸", body: "试试猫牛式：四肢着地，吸气时弓背低头，呼气时塌腰抬头。重复10次，放松脊柱。", category: "拉伸" },
  { emoji: "🥗", title: "营养贴士", body: "训练后的30分钟内补充蛋白质效果最好。一杯牛奶+一根香蕉就是完美的恢复餐。", category: "营养" },
  { emoji: "💤", title: "睡眠修复", body: "肌肉在睡眠中生长。今晚争取比平时早睡30分钟，给身体多一点修复时间。", category: "恢复" },
  { emoji: "💧", title: "补水提醒", body: "休息日也要保持水分。每天喝够体重(kg)×30ml的水，帮助代谢废物排出。", category: "营养" },
  { emoji: "🧠", title: "心态调适", body: "休息不是偷懒，是训练的一部分。顶尖运动员都懂得：进步发生在休息中，而不是训练中。", category: "心态" },
  { emoji: "🫁", title: "呼吸练习", body: "试试4-7-8呼吸法：吸气4秒→屏息7秒→缓慢呼气8秒。重复4轮，缓解压力、改善睡眠。", category: "拉伸" },
  { emoji: "🦶", title: "筋膜放松", body: "找个网球踩在脚底滚动2分钟，放松足底筋膜。脚舒服了，全身都轻松。", category: "恢复" },
  { emoji: "🥩", title: "蛋白质指南", body: "每天每公斤体重需要1.2-1.6g蛋白质。60kg的你大约需要72-96g，约等于3个鸡蛋+200g鸡胸肉。", category: "营养" },
  { emoji: "📖", title: "小铁说", body: "你知道吗？坚持运动21天以上，大脑会形成新的神经通路，运动就会变成习惯而不是任务。", category: "激励" },
];

function getRestDayTip(): typeof restDayTips[0] {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return restDayTips[dayOfYear % restDayTips.length];
}

const encouragements = [
  '你比你想象的更强大',
  '每一次训练都在变得更好',
  '不用和别人比，今天的你比昨天强就够了',
  '累了就歇，好了就练，身体会告诉你答案',
];

const moodOptions = [
  { emoji: '💪', label: '充满能量', color: 'bg-green-100 text-green-700 border-green-200' },
  { emoji: '😊', label: '还不错', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { emoji: '😐', label: '一般般', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { emoji: '😴', label: '有点累', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { emoji: '😣', label: '不想动', color: 'bg-red-100 text-red-600 border-red-200' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  const key = hour < 10 ? 'morning' : hour < 14 ? 'afternoon' : hour < 19 ? 'evening' : 'night';
  return greetings[key][Math.floor(Math.random() * greetings[key].length)];
}

function getEncouragement(): string {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

// 判断今天是否是休息日（当前计划中是休息日）

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState<string | null>(localStorage.getItem('fitforge_mood_today'));
  const navigate = useNavigate();
  const greeting = getGreeting();
  const encouragement = getEncouragement();
  const today = new Date().toISOString().split('T')[0];

  // 每日重置心情
  useEffect(() => {
    const savedDate = localStorage.getItem('fitforge_mood_date');
    if (savedDate !== today) {
      localStorage.removeItem('fitforge_mood_today');
      localStorage.removeItem('fitforge_mood_date');
      setMood(null);
    }
  }, [today]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMood = (m: string) => {
    setMood(m);
    localStorage.setItem('fitforge_mood_today', m);
    localStorage.setItem('fitforge_mood_date', today);
  };

  if (loading) { return <DashboardSkeleton />; }

  if (!data) { return (<div className='min-h-screen bg-[#faf9f6] flex items-center justify-center'><div className='text-center'><p className='text-3xl mb-3'>🤔</p><p className='text-gray-500 text-sm mb-4'>小铁好像走神了...</p><button onClick={() => window.location.reload()} className='text-amber-600 text-sm hover:underline'>再试一次</button></div></div>); }

  const buddyName = '小铁';

  // 根据心情调整问候
  const moodGreeting = mood
    ? mood === '不想动' ? '没关系，歇一天也是训练的一部分 🫂'
    : mood === '有点累' ? '那今天就轻松一点，不勉强 🤲'
    : mood === '充满能量' ? '太好啦！今天状态爆棚，冲一把 🔥'
    : ''
    : '';

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        {/* 搭子对话区 */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            💪
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-0.5">{buddyName}</p>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{greeting}</p>
              {data.streak > 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                  你已经连续训练 <span className="font-bold">{data.streak}</span> 天了，真为你高兴 🎉
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 心情签到 */}
        {!mood && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2">今天感觉怎么样？</p>
            <div className="flex gap-2 flex-wrap">
              {moodOptions.map(opt => (
                <button key={opt.label} onClick={() => handleMood(opt.label)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition-all hover:scale-105 bg-white border-gray-200 text-gray-600 hover:border-amber-300">
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mood && moodGreeting && (
          <div className="mb-6 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">{moodGreeting}</p>
          </div>
        )}

        {/* 今日核心 */}
        <div className="mb-8">
          {data.todayWorkout && !data.todayCompleted ? (
            <button
              onClick={() => navigate(`/play/${data.todayWorkout.week}-${data.todayWorkout.day}`)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-amber-200 hover:border-amber-300 transition-colors text-left group"
            >
              <p className="text-xs text-gray-400 mb-1">🏋️ 今日训练</p>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {data.todayWorkout.main?.[0] || '训练日'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    第 {data.todayWorkout.week} 周 · {data.todayWorkout.exercises?.length || 0} 个动作
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  ▶
                </div>
              </div>
            </button>
          ) : data.todayCompleted ? (
            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✅</span>
                <span className="font-bold text-green-800">今天已完成训练</span>
              </div>
              <p className="text-sm text-green-600">好好休息，明天见～</p>
            </div>
          ) : data.hasPlan && !data.todayWorkout ? (() => {
            const tip = getRestDayTip();
            return (
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">😌</span>
                <span className="font-bold text-blue-800">今天是休息日</span>
                <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{tip.category}</span>
              </div>
              <div className="flex items-start gap-3 mt-3">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">{tip.title}</p>
                  <p className="text-xs text-blue-600 mt-1 leading-relaxed">{tip.body}</p>
                </div>
              </div>
            </div>
            );
          })() : data.hasPlan ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500 text-sm mb-3">今天没有安排训练，自由活动吧～</p>
              <button onClick={() => navigate('/plan')}
                className="text-amber-600 text-sm font-medium hover:underline">查看完整计划</button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/assessment')}
              className="w-full bg-amber-400 text-white rounded-2xl p-5 shadow-sm hover:bg-amber-500 transition-colors text-center"
            >
              <p className="text-lg font-bold mb-1">开始我们的第一次训练</p>
              <p className="text-sm text-amber-50">先做个简单的体能评估，小铁帮你定制计划</p>
            </button>
          )}
        </div>

        {/* 小铁的建议 */}
        {data.suggestion && (
          <div className="mb-8 bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-start gap-2">
              <span className="text-lg">💪</span>
              <div>
                <p className="text-xs font-bold text-amber-700 mb-0.5">小铁的建议</p>
                <p className="text-sm text-amber-600">{data.suggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* 鼓励语 */}
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm italic">"{encouragement}"</p>
        </div>

        {/* 小数据 */}
        {data.totalWorkouts > 0 && (
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-800">{data.totalWorkouts}</div>
              <div className="text-xs text-gray-400 mt-0.5">总训练</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-800">{data.streak}</div>
              <div className="text-xs text-gray-400 mt-0.5">连续天</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-800">{data.weekWorkouts}</div>
              <div className="text-xs text-gray-400 mt-0.5">本周</div>
            </div>
          </div>
        )}

        {/* 身体数据 */}
        {data.profile && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">📏 身体数据</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'BMI', value: data.profile.bmi?.toFixed(1), unit: '', color: 'text-amber-600' },
                { label: '身高', value: data.profile.height, unit: 'cm', color: 'text-gray-700' },
                { label: '体重', value: data.profile.weight, unit: 'kg', color: 'text-gray-700' },
                { label: 'BMR', value: Math.round(data.profile.bmr), unit: 'kcal', color: 'text-amber-600' },
              ].map(item => (
                <div key={item.label}>
                  <div className={`text-xl font-extrabold ${item.color}`}>{item.value}{item.unit}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作入口 */}
        <div className="flex justify-center gap-6">
          {[
            { icon: '📋', label: '计划', path: '/plan' },
            { icon: '📊', label: '评估', path: '/assessment' },
            { icon: '👤', label: '画像', path: '/profile' },
            { icon: '⚙️', label: '设置', path: '/settings' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
