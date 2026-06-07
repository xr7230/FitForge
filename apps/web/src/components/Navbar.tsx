import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  if (!token) return null;

  return (
    <nav className="bg-[#faf9f6]/90 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-lg mx-auto px-5 flex items-center justify-between h-12">
        <Link to="/dashboard" className="flex items-center gap-1.5">
          <span className="text-lg">💪</span>
          <span className="text-sm font-bold text-gray-800">FitForge</span>
        </Link>
        <div className="flex items-center gap-1">
          {[
            { path: '/measurements', label: '数据' },
          { path: '/history', label: '记录' },
          { path: '/achievements', label: '成就' },
          { path: '/settings', label: '设置' },
          { path: '/plan', label: '计划' },
            { path: '/assessment', label: '评估' },
            { path: '/profile', label: '画像' },
          ].map(item => (
            <Link key={item.path} to={item.path}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                location.pathname === item.path
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {item.label}
            </Link>
          ))}
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('userId'); navigate('/login'); }}
            className="ml-1 px-2 py-1 text-xs text-gray-300 hover:text-gray-500 transition-colors">
            退出
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
