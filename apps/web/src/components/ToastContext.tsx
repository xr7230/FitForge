import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "buddy";

interface Toast {
  id: number; message: string; type: ToastType; exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showBuddy: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {}, showBuddy: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    const timer = setTimeout(() => removeToast(id), 3000);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const showBuddy = useCallback((message: string) => addToast(message, "buddy"), [addToast]);

  const bgMap: Record<ToastType, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-gray-800",
    buddy: "bg-amber-500",
  };

  const iconMap: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    buddy: "💪",
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast, showBuddy }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg flex items-center gap-2 transition-all duration-300 ${
              bgMap[t.type]
            } ${t.exiting ? "opacity-0 translate-y-[-8px] scale-95" : "opacity-100 translate-y-0 scale-100"}`}
          >
            <span>{iconMap[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
