"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type Locale = "zh-CN" | "zh-TW" | "en" | "ja";

const STORAGE_KEY = "witch-trial-locale";
const LOCALE_MAP: Record<string, Locale> = {
  zh: "zh-CN", "zh-CN": "zh-CN", "zh-Hans": "zh-CN", "zh-Hans-CN": "zh-CN",
  "zh-TW": "zh-TW", "zh-Hant": "zh-TW", "zh-Hant-TW": "zh-TW", "zh-HK": "zh-TW", "zh-MO": "zh-TW",
  en: "en", "en-US": "en", "en-GB": "en", "en-AU": "en", "en-CA": "en",
  ja: "ja", "ja-JP": "ja",
};

function detectLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && LOCALE_MAP[stored]) return stored;
  const nav = navigator.language;
  return LOCALE_MAP[nav] ?? (nav.startsWith("zh") ? (nav.includes("Hant") || nav.includes("TW") || nav.includes("HK") ? "zh-TW" : "zh-CN") : "zh-CN");
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translations: Record<string, unknown>;
  mounted: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loaders: Record<Locale, () => Promise<any>> = {
  "zh-CN": () => import("@/i18n/zh-CN").then((m) => m.default),
  "zh-TW": () => import("@/i18n/zh-TW").then((m) => m.default),
  en: () => import("@/i18n/en").then((m) => m.default),
  ja: () => import("@/i18n/ja").then((m) => m.default),
};

/**
 * 把 CopyEntry 调配中心的覆盖值（点分路径 → 文案）合并到内置翻译之上。
 * 后台「全站文案」/ content.yaml sync 改的文案经 /api/copy 在这里生效；
 * DB 无记录的 key 保持内置默认。
 */
function applyCopyOverrides(
  base: Record<string, unknown>,
  entries: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = JSON.parse(JSON.stringify(base));
  for (const [path, value] of Object.entries(entries)) {
    const keys = path.split(".");
    let node: Record<string, unknown> = out;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (node[k] == null || typeof node[k] !== "object") node[k] = {};
      node = node[k] as Record<string, unknown>;
    }
    node[keys[keys.length - 1]] = value;
  }
  return out;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh-CN");
  const [translations, setTranslations] = useState<Record<string, unknown>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLocaleState(detectLocale());
    });
  }, []);

  useEffect(() => {
    let alive = true;
    loaders[locale]().then((t) => {
      if (!alive) return;
      setTranslations(t);
      setMounted(true);
    });
    // DB 文案覆盖：拉取失败或为空时保持内置默认，无感降级。
    fetch(`/api/copy?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data?.entries) return;
        if (Object.keys(data.entries as object).length === 0) return;
        return loaders[locale]().then((base) => {
          if (alive) setTranslations(applyCopyOverrides(base, data.entries));
        });
      })
      .catch(() => { /* 覆盖拉取失败 → 内置默认 */ });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    return () => {
      alive = false;
    };
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    if (!mounted) return key;
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = translations;
    for (const k of keys) {
      if (val == null || typeof val !== "object") return key;
      val = val[k];
    }
    if (typeof val !== "string") return key;
    if (vars) {
      return val.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
    }
    return val;
  }, [translations, mounted]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations, mounted }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
};
