"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { hasBackend } from "@/lib/env";
import type { User } from "@supabase/supabase-js";
import { useBrowserValue } from "@/lib/browser-storage";
type Language = "zh" | "en";
const Context = createContext<{
  language: Language;
  setLanguage: (v: Language) => void;
  t: (zh: string, en: string) => string;
  user: User | null;
  authLoading: boolean;
}>({
  language: "zh",
  setLanguage: () => {},
  t: (zh) => zh,
  user: null,
  authLoading: false,
});
export function Providers({ children }: { children: React.ReactNode }) {
  const [savedLanguage, saveLanguage] = useBrowserValue(
    "compass-language",
    "localStorage",
    "zh",
  );
  const language: Language = savedLanguage === "en" ? "en" : "zh";
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(hasBackend());
  useEffect(() => {
    if (!hasBackend()) return;
    const c = createClient();
    c.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
    const { data } = c.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);
  const setLanguage = (value: Language) => {
    saveLanguage(value);
  };
  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        t: (zh, en) => (language === "zh" ? zh : en),
        user,
        authLoading,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useI18n = () => useContext(Context);
