import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  dimension: string;
  question: string;
  options: { label: string; score: number }[];
}

const questions: Question[] = [
  // 心肺耐力 (3题)
  { id: 'c1', dimension: '心肺耐力', question: '你连续慢跑能坚持多长时间不休息？', options: [
    { label: '少于5分钟', score: 1 }, { label: '5-10分钟', score: 3 }, { label: '10-20分钟', score: 5 },
    { label: '20-30分钟', score: 7 }, { label: '30分钟以上', score: 9 },
  ]},
  { id: 'c2', dimension: '心肺耐力', question: '上三层楼梯后你的感觉是？', options: [
    { label: '非常气喘，需要休息很久', score: 1 }, { label: '较喘，需要短暂休息', score: 3 },
    { label: '微喘，很快恢复', score: 5 }, { label: '气稍促，几乎不喘', score: 7 },
    { label: '轻松自如，毫无感觉', score: 9 },
  ]},
  { id: 'c3', dimension: '心肺耐力', question: '你平时做有氧运动的频率？（跑步/游泳/骑行等）', options: [
    { label: '几乎不做', score: 1 }, { label: '每月1-2次', score: 3 }, { label: '每周1-2次', score: 5 },
    { label: '每周3-4次', score: 7 }, { label: '每周5次以上', score: 9 },
  ]},
  // 肌肉力量 (3题)
  { id: 's1', dimension: '肌肉力量', question: '你能连续完成多少个标准俯卧撑？', options: [
    { label: '0-5个', score: 1 }, { label: '6-10个', score: 3 }, { label: '11-20个', score: 5 },
    { label: '21-30个', score: 7 }, { label: '30个以上', score: 9 },
  ]},
  { id: 's2', dimension: '肌肉力量', question: '你能徒手完成多少个自重深蹲？', options: [
    { label: '0-10个', score: 1 }, { label: '11-20个', score: 3 }, { label: '21-30个', score: 5 },
    { label: '31-50个', score: 7 }, { label: '50个以上', score: 9 },
  ]},
  { id: 's3', dimension: '肌肉力量', question: '你平时进行力量训练的频率？', options: [
    { label: '几乎不练', score: 1 }, { label: '偶尔练一下', score: 3 }, { label: '每周1-2次', score: 5 },
    { label: '每周3-4次', score: 7 }, { label: '每周5次以上', score: 9 },
  ]},
  // 柔韧性 (2题)
  { id: 'f1', dimension: '柔韧性', question: '站立腿伸直，你弯腰手指能碰到哪里？', options: [
    { label: '大腿中部以上', score: 1 }, { label: '膝盖附近', score: 3 }, { label: '小腿中部', score: 5 },
    { label: '脚踝处', score: 7 }, { label: '手掌触地', score: 9 },
  ]},
  { id: 'f2', dimension: '柔韧性', question: '你平时做拉伸/瑜伽的频率？', options: [
    { label: '几乎不做', score: 1 }, { label: '每月2-3次', score: 3 }, { label: '每周1次', score: 5 },
    { label: '每周2-3次', score: 7 }, { label: '每天都有', score: 9 },
  ]},
  // 平衡性 (2题)
  { id: 'b1', dimension: '平衡性', question: '闭眼单脚站立你能坚持多久？', options: [
    { label: '5秒以内站不稳', score: 1 }, { label: '5-15秒', score: 3 }, { label: '15-30秒', score: 5 },
    { label: '30-60秒', score: 7 }, { label: '60秒以上稳稳当当', score: 9 },
  ]},
  { id: 'b2', dimension: '平衡性', question: '你做过平衡相关的训练吗？（单腿动作/瑜伽/普拉提等）', options: [
    { label: '从未做过', score: 1 }, { label: '偶尔尝试', score: 3 }, { label: '偶尔做相关训练', score: 5 },
    { label: '经常练习', score: 7 }, { label: '长期系统训练', score: 9 },
  ]},
];

const Assessment: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const selectAnswer = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const calcDimensionScore = (dim: string): number => {
    const dimQuestions = questions.filter(q => q.dimension === dim);
    const scores = dimQuestions.map(q => answers[q.id] || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  };

  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) { setError('请回答所有问题'); return; }

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!userId || !token) { setError('请先登录'); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          cardioEndurance: calcDimensionScore('心肺耐力'),
          muscleStrength: calcDimensionScore('肌肉力量'),
          flexibility: calcDimensionScore('柔韧性'),
          balance: calcDimensionScore('平衡性'),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || '提交失败'); setSubmitting(false); return; }

      setSuccess('评估完成！正在跳转到用户画像...');
      setTimeout(() => navigate('/profile'), 1200);
    } catch {
      setError('网络错误，请稍后重试');
      setSubmitting(false);
    }
  };

  const getGroupedQuestions = () => {
    const groups: Record<string, Question[]> = {};
    for (const q of questions) {
      if (!groups[q.dimension]) groups[q.dimension] = [];
      groups[q.dimension].push(q);
    }
    return groups;
  };

  const dimIcons: Record<string, string> = { '心肺耐力': '🫀', '肌肉力量': '💪', '柔韧性': '🧘', '平衡性': '⚖️' };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">体能评估</h2>
          <p className="mt-2 text-sm text-gray-600">
            共 {questions.length} 题，回答完成后方可提交。请根据实际情况如实作答。
          </p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Object.keys(answers).length} / {questions.length} 题已答</p>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">{error}</div>}
        {success && <div className="p-4 bg-green-100 text-green-700 rounded-md mb-6">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-10">
          {Object.entries(getGroupedQuestions()).map(([dim, qs]) => (
            <div key={dim}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">{dimIcons[dim] || '📋'}</span> {dim}
              </h3>
              <div className="space-y-6">
                {qs.map(q => (
                  <div key={q.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                    <p className="text-sm font-medium text-gray-800 mb-3">{q.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map(opt => (
                        <button
                          key={opt.score}
                          type="button"
                          onClick={() => selectAnswer(q.id, opt.score)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            answers[q.id] === opt.score
                              ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {answers[q.id] !== undefined && (
                      <p className="mt-2 text-xs text-amber-500">已选：{q.options.find(o => o.score === answers[q.id])?.label}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={!allAnswered || submitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                allAnswered && !submitting
                  ? 'bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {submitting ? '提交中...' : allAnswered ? '提交评估' : `还有 ${questions.length - Object.keys(answers).length} 题未答`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Assessment;



