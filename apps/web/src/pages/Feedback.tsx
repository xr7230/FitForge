import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Feedback: React.FC = () => {
  const [feedback, setFeedback] = useState('完成');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { setError('请先登录'); return; }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workoutDate: new Date().toISOString().split('T')[0], feedback }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '提交失败'); return; }

      setSuccess('反馈提交成功！');
      setTimeout(() => navigate('/plan'), 1200);
    } catch { setError('网络错误，请稍后重试'); }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">训练反馈</h2>
            <p className="mt-2 text-sm text-gray-600">请评价你今天的训练感受</p>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-md mb-4 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              {['完成', '太难', '太简单'].map(opt => (
                <label key={opt} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-amber-300 transition-colors">
                  <input type="radio" name="feedback" value={opt} checked={feedback === opt}
                    onChange={() => setFeedback(opt)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300" />
                  <span className="ml-3 text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            <button type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-400 hover:bg-amber-500 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              提交反馈
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;



