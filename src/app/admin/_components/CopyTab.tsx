"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import AutoTextarea from "./AutoTextarea";

type Rec = Record<string, any>;

/**
 * 全站文案 tab — CopyEntry 调配中心的统一编辑界面。
 * 四个分组（界面 / 首页 / 404 / 错误态）× 四语言，一处改完全站生效：
 *   - 值留空保存 = 删除覆盖，恢复代码内置默认
 *   - content.yaml sync 会覆盖 yaml 中定义的同 key 行（yaml 是种子权威）
 */
const GROUPS = [
  { key: "ui", label: "界面文案", hint: "测试流程 + 结果页的界面文字（works / meta / loading / test / result / disclaimer）" },
  { key: "home", label: "首页", hint: "序章落地页（标题 / 标语 / 按钮 / 全屏提示），无内置默认兜底展示" },
  { key: "nf", label: "404 页", hint: "「该页已被审判」结界治愈页" },
  { key: "err", label: "错误态", hint: "题目加载失败 / 结果生成失败提示" },
] as const;
type GroupKey = (typeof GROUPS)[number]["key"];

const LANGS = [
  { code: "zh-CN", label: "简中" },
  { code: "zh-TW", label: "繁體" },
  { code: "en", label: "EN" },
  { code: "ja", label: "日文" },
] as const;
type LangCode = (typeof LANGS)[number]["code"];

export default function CopyTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response> }) {
  const [entries, setEntries] = useState<Rec[]>([]);
  const [defaults, setDefaults] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [group, setGroup] = useState<GroupKey>("ui");
  const [locale, setLocale] = useState<LangCode>("zh-CN");
  const [search, setSearch] = useState("");
  /** 草稿：key = `${group}|${locale}|${key}` → 值（空字符串 = 恢复默认） */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/copy");
      const data = await res.json();
      setEntries(data.entries || []);
      setDefaults(data.defaults || {});
    } catch { } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { queueMicrotask(() => { void fetchAll(); }); }, [fetchAll]);

  const dbValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of entries) {
      if (e.group === group && e.locale === locale) map[e.key as string] = e.value as string;
    }
    return map;
  }, [entries, group, locale]);

  /** 当前分组下的全部可编辑 key = DB 覆盖 keys ∪ 内置默认 keys */
  const allKeys = useMemo(() => {
    const keys = new Set<string>(Object.keys(dbValues));
    if (group !== "home") {
      const prefix = group === "nf" ? "nf." : group === "err" ? "err." : "";
      for (const path of Object.keys(defaults[locale] || {})) {
        if (group === "ui" && (path.startsWith("nf.") || path.startsWith("err."))) continue;
        if (prefix && path.startsWith(prefix)) keys.add(path.slice(prefix.length));
        else if (!prefix) keys.add(path);
      }
    }
    return [...keys].sort();
  }, [dbValues, defaults, group, locale]);

  const visibleKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allKeys;
    return allKeys.filter((k) => {
      const v = drafts[`${group}|${locale}|${k}`] ?? dbValues[k] ?? defaults[locale]?.[group === "nf" ? `nf.${k}` : group === "err" ? `err.${k}` : k] ?? "";
      return k.toLowerCase().includes(q) || v.toLowerCase().includes(q);
    });
  }, [allKeys, search, drafts, dbValues, defaults, group, locale]);

  const valueOf = (key: string): string => {
    const draft = drafts[`${group}|${locale}|${key}`];
    if (draft !== undefined) return draft;
    return dbValues[key] ?? "";
  };

  const defaultOf = (key: string): string => {
    if (group === "home") return "";
    const path = group === "nf" ? `nf.${key}` : group === "err" ? `err.${key}` : key;
    return defaults[locale]?.[path] ?? "";
  };

  const setDraft = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [`${group}|${locale}|${key}`]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const items = allKeys.map((key) => ({ key, value: valueOf(key) }));
      const res = await api("/copy", { method: "PUT", body: JSON.stringify({ group, locale, items }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setMsg({ text: `已保存（覆盖 ${data.saved} 条 / 恢复默认 ${data.removed} 条）`, ok: true });
      fetchAll();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "保存失败", ok: false });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ color: "rgba(255,255,255,0.3)" }}>加载中...</div>;

  const groupHint = GROUPS.find((g) => g.key === group)?.hint;
  const dirtyCount = Object.keys(drafts).length;

  return (
    <div className="admin-tab">
      <p className="admin-hint">
        全站文案统一调配：改完即生效（页面下次加载生效），无需部署。值留空保存 = 恢复内置默认；
        跑 <code>sync-content</code> 时 content.yaml 里定义过的键会被 yaml 覆盖。
      </p>

      {/* 分组 chips */}
      <div className="admin-copy-groups" role="tablist">
        {GROUPS.map((g) => (
          <button key={g.key} className="admin-copy-chip" data-active={group === g.key}
            onClick={() => setGroup(g.key)}>{g.label}</button>
        ))}
      </div>
      {groupHint && <p className="admin-hint" style={{ marginTop: "-0.6rem" }}>{groupHint}</p>}

      {/* 语言切换 + 搜索 */}
      <div className="admin-copy-toolbar">
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: 2, width: "fit-content" }}>
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLocale(l.code)}
              style={{ background: locale === l.code ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: locale === l.code ? "#d4af37" : "rgba(255,255,255,0.3)", padding: "0.25rem 0.7rem", borderRadius: 3, fontSize: "0.78rem", cursor: "pointer", fontWeight: locale === l.code ? 700 : 400 }}>
              {l.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索键名或文案…"
          className="admin-copy-search" />
      </div>

      {/* 键值编辑列表 */}
      {visibleKeys.length === 0 && (
        <div className="admin-group-empty">（该分组下暂无 {locale} 文案）</div>
      )}
      {visibleKeys.map((key) => {
        const value = valueOf(key);
        const def = defaultOf(key);
        const overridden = dbValues[key] !== undefined && dbValues[key] !== def;
        return (
          <div key={key} className="admin-card admin-copy-row" data-overridden={overridden || undefined}>
            <div className="admin-copy-row-head">
              <code className="admin-copy-key">{key}</code>
              <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                {overridden && <span className="asset-badge">已覆盖</span>}
                {(value !== "" || dbValues[key] !== undefined) && def !== value && (
                  <button className="admin-btn-ghost" title="清空并恢复内置默认"
                    onClick={() => setDraft(key, "")}>恢复默认</button>
                )}
              </div>
            </div>
            <AutoTextarea value={value} minRows={2}
              onChange={(e) => setDraft(key, e.target.value)}
              className="admin-input admin-textarea"
              placeholder={def ? `内置默认：${def}` : "（首页无内置默认展示，留空将不显示）"} />
          </div>
        );
      })}

      <div className="admin-savebar">
        <button className="admin-btn-primary" onClick={save} disabled={saving}>
          {saving ? "保存中..." : dirtyCount > 0 ? `保存本组（${visibleKeys.length} 条）` : "保存本组"}
        </button>
        {dirtyCount > 0 && (
          <button className="admin-btn-ghost" onClick={() => setDrafts({})}>放弃修改</button>
        )}
        {msg && <span style={{ fontSize: "0.75rem", color: msg.ok ? "#4ade80" : "#ef4444" }}>{msg.text}</span>}
      </div>
    </div>
  );
}
