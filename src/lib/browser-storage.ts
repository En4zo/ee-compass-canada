"use client";
import { useCallback, useSyncExternalStore } from "react";
// 服务器渲染使用稳定默认值，浏览器挂载后读取偏好，避免 hydration 不一致。
export function useBrowserValue(
  key: string,
  scope: "localStorage" | "sessionStorage",
  fallback: string | null = null,
) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener("compass-storage", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("compass-storage", callback);
    };
  }, []);
  const read = useCallback(() => {
    try {
      return window[scope].getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, scope, fallback]);
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const setValue = (next: string | null) => {
    try {
      if (next === null) window[scope].removeItem(key);
      else window[scope].setItem(key, next);
      window.dispatchEvent(new Event("compass-storage"));
    } catch {
      /* 隐私模式禁用存储时不影响核心页面。 */
    }
  };
  return [value, setValue] as const;
}
