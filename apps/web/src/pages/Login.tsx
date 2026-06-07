import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (localStorage.getItem('token')) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || '登录失败', 'error'); setLoading(false); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id.toString());
      showToast('欢迎回来！', 'buddy');
      navigate('/dashboard');
    } catch { showToast('网络错误', 'error'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">登录</h2>
          <p className="mt-1 text-sm text-gray-500">小铁在等你 💪</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1">邮箱</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1">密码</label>
            <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className={"w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors " +
              (loading ? "bg-gray-300" : "bg-amber-400 hover:bg-amber-500")}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="text-center">
          <Link to="/register" className="text-xs text-amber-600 hover:text-amber-500">还没有账号？注册</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
