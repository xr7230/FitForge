import React from "react";
import { useNavigate, Navigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  if (localStorage.getItem("token") || localStorage.getItem("fitforge_demo_mode") === "true") return <Navigate to="/dashboard" replace />;

  const enterDemo = () => {
    localStorage.setItem("fitforge_demo_mode", "true");
    localStorage.setItem("token", "demo-token-xxx");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-6 w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl shadow-sm">
          💪
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">FitForge</h1>
        <p className="text-amber-600 font-medium text-sm mb-4">????????</p>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-10">
          ??????? App?<br />
          ???????????????<span className="font-bold text-gray-700">????</span>?????
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-sm mb-10">
          {[
            { icon: "🧠", title: "AI ??", desc: "??????" },
            { icon: "💬", title: "????", desc: "????????" },
            { icon: "📈", title: "????", desc: "?????" },
          ].map(item => (
            <div key={item.title} className="text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs font-medium text-gray-700">{item.title}</p>
              <p className="text-[10px] text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-xs py-3 bg-amber-400 text-white rounded-full font-bold text-sm hover:bg-amber-500 transition-colors shadow-sm mb-3"
        >
          ????
        </button>
        <button
          onClick={() => navigate("/register")}
          className="w-full max-w-xs py-3 bg-white text-gray-600 rounded-full font-medium text-sm border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition-colors"
        >
          ????
        </button>
        <div className="mt-6 pt-6 border-t border-gray-100 max-w-xs w-full">
          <p className="text-[10px] text-gray-300 mb-2">?????</p>
          <button
            onClick={enterDemo}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            🚀 ????
          </button>
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-[10px] text-gray-300">
          ?????????? 🦾
        </p>
      </div>
    </div>
  );
};

export default Welcome;
