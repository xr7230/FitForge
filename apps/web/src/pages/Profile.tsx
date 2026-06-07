import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [weeklyWorkoutDays, setWeeklyWorkoutDays] = useState('3');
  const [workoutDuration, setWorkoutDuration] = useState('30');
  const [preferredWorkoutType, setPreferredWorkoutType] = useState('混合');
  const [experienceLevel, setExperienceLevel] = useState('新手');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const p = data.profile;
        setAge(String(p.age));
        setGender(p.gender);
        setHeight(String(p.height));
        setWeight(String(p.weight));
        setWeeklyWorkoutDays(String(p.weekly_workout_days));
        setWorkoutDuration(String(p.workout_duration));
        setPreferredWorkoutType(p.preferred_workout_type);
        setExperienceLevel(p.experience_level);
        setLoading(false);
      } catch { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    if (!token) { setError('请先登录'); return; }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: parseInt(age), gender, height: parseFloat(height), weight: parseFloat(weight),
          weeklyWorkoutDays: parseInt(weeklyWorkoutDays), workoutDuration: parseInt(workoutDuration),
          preferredWorkoutType, experienceLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '保存失败'); return; }

      setSuccess('用户画像保存成功！正在跳转到计划页面...');
      setTimeout(() => navigate('/plan'), 1200);
    } catch { setError('网络错误，请稍后重试'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400 mx-auto" />
          <p className="mt-3 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">用户画像</h2>
          <p className="mt-2 text-sm text-gray-600">填写你的基本信息和运动偏好，以便为你生成个性化的训练计划</p>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-6 text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded-md mb-6 text-sm">{success}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">年龄</label>
              <input type="number" required value={age} onChange={e => setAge(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">性别</label>
              <div className="mt-2 flex gap-4">
                {(['male', 'female'] as const).map(g => (
                  <label key={g} className="flex items-center cursor-pointer">
                    <input type="radio" name="gender" value={g} checked={gender === g}
                      onChange={() => setGender(g)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300" />
                    <span className="ml-1.5 text-sm text-gray-700">{g === 'male' ? '男' : '女'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">身高 (cm)</label>
              <input type="number" required value={height} onChange={e => setHeight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">体重 (kg)</label>
              <input type="number" required value={weight} onChange={e => setWeight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">每周可运动天数</label>
              <select value={weeklyWorkoutDays} onChange={e => setWeeklyWorkoutDays(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} 天</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">每次可运动时长 (分钟)</label>
              <select value={workoutDuration} onChange={e => setWorkoutDuration(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} 分钟</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">喜好的运动类型</label>
              <select value={preferredWorkoutType} onChange={e => setPreferredWorkoutType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                <option value="有氧">有氧</option>
                <option value="力量">力量</option>
                <option value="柔韧">柔韧</option>
                <option value="混合">混合</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">运动经验</label>
              <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                <option value="新手">新手</option>
                <option value="进阶">进阶</option>
                <option value="高级">高级</option>
              </select>
            </div>
          </div>

          <div className="pt-2 pb-8">
            <button type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-400 hover:bg-amber-500 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              保存用户画像
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;



