import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import { useNotifications } from "../hooks/useNotifications";

const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];

const Settings: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { permission, settings: notifSettings, requestPermission, updateSettings } = useNotifications();
  const token = localStorage.getItem("token");

  const [llmConfig, setLLMConfig] = useState(() => {
    try {
      const raw = localStorage.getItem("fitforge_llm_config");
      return raw ? JSON.parse(raw) : { provider: "openai", apiKey: "", model: "gpt-4o-mini" };
    } catch { return { provider: "openai", apiKey: "", model: "gpt-4o-mini" }; }
  });
  const [showLLMForm, setShowLLMForm] = useState(false);

  const saveLLMConfig = () => {
    localStorage.setItem("fitforge_llm_config", JSON.stringify(llmConfig));
    setShowLLMForm(false);
    showToast("AI 配置已保存！", "success");
  };

  const handleExport = async (type: string, format: string = "json") => {
    setExporting(type);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export/${type}?format=${format}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("导出失败");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fitforge-" + type + "." + format;
      a.click();
      URL.revokeObjectURL(url);
      showToast("导出成功！", "success");
    } catch {
      showToast("导出失败", "error");
    }
    setExporting(null);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-6">⚙️ 设置</h2>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">🤖 AI 搭子</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">接入 LLM 让小铁更聪明（可选）</p>
            </div>
            <button onClick={() => setShowLLMForm(!showLLMForm)}
              className="text-xs text-amber-600 font-medium hover:underline">
              {showLLMForm ? "收起" : llmConfig.apiKey ? "已配置 ✓" : "配置"}
            </button>
          </div>
          {showLLMForm && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">提供商</label>
                <select value={llmConfig.provider} onChange={e => setLLMConfig({ ...llmConfig, provider: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300">
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">API Key</label>
                <input type="password" value={llmConfig.apiKey}
                  onChange={e => setLLMConfig({ ...llmConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300" />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">模型（可选）</label>
                <input type="text" value={llmConfig.model}
                  onChange={e => setLLMConfig({ ...llmConfig, model: e.target.value })}
                  placeholder={llmConfig.provider === "openai" ? "gpt-4o-mini" : "deepseek-chat"}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300" />
              </div>
              <p className="text-[10px] text-gray-400">
                Key 保存在浏览器本地，不会上传到服务器。不填则使用智能话术模式。
              </p>
              <button onClick={saveLLMConfig}
                className="w-full py-2 rounded-xl text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                保存配置
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🔔 训练提醒</h3>
          {permission === "default" ? (
            <button onClick={requestPermission}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
              🔔 开启通知权限
            </button>
          ) : permission === "denied" ? (
            <p className="text-xs text-gray-400">通知已被浏览器拒绝，请在浏览器设置中手动开启</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">启用提醒</span>
                <button onClick={() => updateSettings({ ...notifSettings, enabled: !notifSettings.enabled })}
                  className={"w-11 h-6 rounded-full transition-colors relative " + (notifSettings.enabled ? "bg-amber-400" : "bg-gray-200")}>
                  <span className={"absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " + (notifSettings.enabled ? "translate-x-5" : "translate-x-0.5")} />
                </button>
              </div>
              {notifSettings.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">提醒时间</span>
                    <input type="time" value={notifSettings.time}
                      onChange={e => updateSettings({ ...notifSettings, time: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1.5">提醒日</span>
                    <div className="flex gap-1">
                      {dayLabels.map((label, i) => (
                        <button key={i} onClick={() => {
                          const days = notifSettings.days.includes(i)
                            ? notifSettings.days.filter(d => d !== i)
                            : [...notifSettings.days, i].sort();
                          updateSettings({ ...notifSettings, days });
                        }}
                          className={"w-8 h-8 rounded-full text-xs font-medium transition-colors " +
                            (notifSettings.days.includes(i) ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📦 数据导出</h3>
          <p className="text-xs text-gray-500 mb-4">你的数据属于你。随时导出带走。</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">训练历史</p>
                <p className="text-[10px] text-gray-400">JSON / CSV</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport("history", "json")} disabled={exporting === "history"}
                  className="px-3 py-1.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50">JSON</button>
                <button onClick={() => handleExport("history", "csv")} disabled={exporting === "history"}
                  className="px-3 py-1.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50">CSV</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">身体数据</p>
                <p className="text-[10px] text-gray-400">JSON / CSV</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport("measurements", "json")} disabled={exporting === "measurements"}
                  className="px-3 py-1.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50">JSON</button>
                <button onClick={() => handleExport("measurements", "csv")} disabled={exporting === "measurements"}
                  className="px-3 py-1.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50">CSV</button>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button onClick={() => handleExport("all", "json")} disabled={exporting === "all"}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50">
                {exporting === "all" ? "导出中..." : "📦 导出全部数据 (JSON)"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">🔒 隐私 & 数据</h3>
          <div className="space-y-3 text-xs text-gray-500 leading-relaxed">
            <p><strong className="text-gray-700">数据存储：</strong>你的所有数据（训练记录、身体数据、评估结果）都存储在我们的服务器上，不会与任何第三方共享。</p>
            <p><strong className="text-gray-700">数据安全：</strong>密码经过加密存储，任何人都无法看到你的原始密码（包括我们）。</p>
            <p><strong className="text-gray-700">AI 配置：</strong>你的 API Key 仅存储在浏览器本地，每次对话由前端发送到服务器代发 AI 请求，不会被服务器持久化存储。</p>
            <p><strong className="text-gray-700">数据删除：</strong>如需彻底删除账号及所有数据，请联系我们。</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3">ℹ️ 关于</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <p><strong className="text-gray-700">FitForge</strong> v3.1</p>
            <p>你的专属健身搭子 · 小铁 💪</p>
            <p className="text-gray-400">Made with ❤️ for every individual</p>
          </div>
        </div>

        <button onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/login");
        }}
          className="w-full py-3 rounded-2xl text-sm font-medium text-red-500 bg-white border border-red-100 hover:bg-red-50 transition-colors">
          退出登录
        </button>
      </div>
    </div>
  );
};

export default Settings;