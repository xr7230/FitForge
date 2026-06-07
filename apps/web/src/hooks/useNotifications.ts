import { useState, useEffect, useCallback } from "react";

export interface ReminderSettings {
  enabled: boolean;
  time: string;
  days: number[];
}

const STORAGE_KEY = "fitforge_reminder";

export function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, time: "09:00", days: [1, 2, 3, 4, 5] };
}

export function saveReminderSettings(s: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [settings, setSettings] = useState<ReminderSettings>(loadReminderSettings);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const updateSettings = useCallback((s: ReminderSettings) => {
    setSettings(s);
    saveReminderSettings(s);
  }, []);

  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const [h, m] = settings.time.split(":").map(Number);
      const today = now.getDay();
      if (
        settings.days.includes(today) &&
        now.getHours() === h &&
        now.getMinutes() === m &&
        now.getSeconds() < 10
      ) {
        const messages = [
          "💪 训练时间到！小铁在等你～",
          "🏋️ 该动一动了，今天的训练等着你！",
          "🔥 休息够了吧？来一组训练！",
          "🦾 小铁提醒：别忘了今天的训练计划",
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        new Notification("FitForge", {
          body: msg,
          icon: "/icon.svg",
          tag: "fitforge-reminder",
          requireInteraction: true,
        });
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [settings, permission]);

  return { permission, settings, requestPermission, updateSettings };
}
