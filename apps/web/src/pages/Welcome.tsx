import React from "react";
import { useNavigate, Navigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  if (localStorage.getItem("token")) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl shadow-sm">
          💪
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">FitForge</h1>
        <p className="text-amber-600 font-medium text-sm mb-4">你的专属健身搭子</p>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-10">
          不是又一个健身 App。<br />
          而是一个懂你、陪你、推你一把的<span className="font-bold text-gray-700">个人搭子</span>——小铁。
        </p>

        {/* 三个卖点 */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mb-10">
          {[
            { icon: "🧠", title: "AI 定制", desc: "专属训练计划" },
            { icon: "💬", title: "搭子陪伴", desc: "每次训练都有人陪" },
            { icon: "📈", title: "持续进化", desc: "越练越懂你" },
          ].map(item => (
            <div key={item.title} className="text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs font-medium text-gray-700">{item.title}</p>
              <p className="text-[10px] text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-xs py-3 bg-amber-400 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-colors shadow-sm mb-3"
        >
          开始训练
        </button>
        <button
          onClick={() => navigate("/register")}
          className="w-full max-w-xs py-3 bg-white text-gray-600 rounded-full font-medium text-sm border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition-colors"
        >
          创建账号
        </button>
      </div>

      {/* 底部 */}
      <div className="text-center pb-8">
        <p className="text-[10px] text-gray-300">
          小铁会一直在这里等你 🦾
        </p>
      </div>
    </div>
  );
};

export default Welcome;
