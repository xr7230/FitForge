import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "buddy" | "user";
  text: string;
  time: string;
}

const initialGreetings = [
  "嗨！我是小铁，你的专属健身搭子 💪",
  "有什么想聊的？训练、饮食、恢复，我都在行～",
];

const buddyEmojis = ["💪", "🦾", "🔥", "🎯", "🌟"];

const Buddy: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [buddyEmoji] = useState(() => buddyEmojis[Math.floor(Math.random() * buddyEmojis.length)]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load LLM config
  const getLLMConfig = () => {
    try {
      const raw = localStorage.getItem("fitforge_llm_config");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  // Initial greeting
  useEffect(() => {
    const greeting = initialGreetings[Math.floor(Math.random() * initialGreetings.length)];
    setMessages([{ role: "buddy", text: greeting, time: formatTime() }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", text: msg, time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    try {
      const llmConfig = getLLMConfig();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/buddy/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ message: msg, llmConfig }),
      });
      const data = await res.json();
      const buddyMsg: Message = { role: "buddy", text: data.reply, time: formatTime() };
      setMessages(prev => [...prev, buddyMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "buddy", text: "唔，网络不太好，等会儿再试试？", time: formatTime() }]);
    }
    setLoading(false);
  };

  const quickReplies = [
    { label: "今天练什么？", text: "今天有什么训练？" },
    { label: "我好累", text: "今天好累啊" },
    { label: "怎么吃？", text: "训练后应该怎么吃？" },
    { label: "看目标", text: "我的目标进度怎么样？" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">{buddyEmoji}</div>
        <div>
          <p className="text-sm font-bold text-gray-800">小铁</p>
          <p className="text-[10px] text-gray-400">
            {getLLMConfig() ? "🤖 AI 模式" : "💬 智能话术"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : "order-1"}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-400 text-white rounded-br-md"
                  : "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"
              }`}>
                {msg.text}
              </div>
              <p className={`text-[9px] text-gray-300 mt-0.5 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 text-sm px-4 py-2.5 rounded-2xl border border-gray-100 rounded-bl-md shadow-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick replies */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto border-t border-gray-50">
        {quickReplies.map(q => (
          <button key={q.label} onClick={() => sendMessage(q.text)}
            className="px-3 py-1.5 rounded-full text-xs bg-white border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 whitespace-nowrap transition-colors shrink-0">
            {q.label}
          </button>
        ))}
        {!getLLMConfig() && (
          <button onClick={() => navigate("/settings")}
            className="px-3 py-1.5 rounded-full text-xs bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 whitespace-nowrap transition-colors shrink-0">
            ⚡ 接入 AI
          </button>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="和小铁聊聊..."
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center hover:bg-amber-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Buddy;
