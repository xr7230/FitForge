import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  if (localStorage.getItem('token')) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码长度至少6位'); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '注册失败'); return; }
      setSuccess('注册成功！正在跳转登录...');
      setTimeout(() => navigate('/login'), 1200);
    } catch { setError('网络错误，请稍后重试'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">FitForge</h2>
          <p className="mt-2 text-sm text-gray-600">注册以开始你的个性化健身之旅</p>
        </div>
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">确认密码</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <button type="submit"
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-amber-400 hover:bg-amber-500">
            注册
          </button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-amber-600 hover:text-amber-500">已有账号？登录</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;



