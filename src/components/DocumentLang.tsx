"use client";

import { useEffect } from "react";

const LOCALE_MAP: Record<string, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
  ja: "ja",
};

export function DocumentLang() {
  useEffect(() => {
    const nav = navigator.language;
    const matched = Object.keys(LOCALE_MAP).find((k) => nav.startsWith(k));
    document.documentElement.lang = matched || "zh-CN";
  }, []);
  return null;
}
