"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import AutoTextarea from "./AutoTextarea";

type Rec = Record<string, any>;

const NODES = [
  { node: 5, label: "节点 I（第 5 题后 · 试探）" },
  { node: 10, label: "节点 II（第 10 题后 · 逼近）" },
  { node: 15, label: "节点 III（第 15 题后 · 审判）" },
];
const TIERS = [
  { key: "H", label: "高 · 倾向笃定" },
  { key: "M", label: "中 · 来回摇摆" },
  { key: "L", label: "低 · 回避躲闪" },
];

/**
 * 批注文案 tab：节点 × 档位 分组编辑，整包 PUT 保存。
 * 某档位留空 = 该档回退内置文案池（不报错）。
 */
export default function AnnotationsTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response> }) {
  const [rows, setRows] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/annotations");
      setRows(await res.json());
    } catch { } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { queueMicrotask(() => { void fetchRows(); }); }, [fetchRows]);

  const textsFor = (node: number, tier: string) =>
    rows.filter((r) => r.node === node && r.tier === tier).map((r) => r.text as string);

  const setText = (node: number, tier: string, idx: number, text: string) => {
    setRows((prev) => {
      const targets = prev.filter((r) => r.node === node && r.tier === tier);
      const target = targets[idx];
      return prev.map((r) => (r === target ? { ...r, text } : r));
    });
  };

  const addRow = (node: number, tier: string) => {
    setRows((prev) => {
      const order = prev.filter((r) => r.node === node && r.tier === tier).length;
      return [...prev, { node, tier, text: "", order }];
    });
  };

  const removeRow = (node: number, tier: string, idx: number) => {
    setRows((prev) => {
      const targets = prev.filter((r) => r.node === node && r.tier === tier);
      const target = targets[idx];
      return prev.filter((r) => r !== target);
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = rows.filter((r) => (r.text as string).trim().length > 0);
      const res = await api("/annotations", { method: "PUT", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      setMsg({ text: `已保存 ${data.count} 条`, ok: true });
      fetchRows();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "保存失败", ok: false });
    } finally { setSaving(false); }
  };

  // 大改版上线后取回镜像内置文案：清空后台手改，整表重建为当前版本内置池
  const resetToBuiltin = async () => {
    if (!window.confirm("重置将清空当前全部批注（含手改），恢复为代码内置文案池。确定？")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api("/annotations", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "重置失败");
      setMsg({ text: `已重置为内置文案（${data.count} 条）`, ok: true });
      fetchRows();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "重置失败", ok: false });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ color: "rgba(255,255,255,0.3)" }}>加载中...</div>;

  return (
    <div className="admin-tab">
      <p className="admin-hint">
        批注在答完第 5 / 10 / 15 题后浮现，按用户作答倾向选档展示。留空保存 = 该格回退内置文案。
      </p>
      {NODES.map(({ node, label }) => (
        <div key={node} className="admin-card">
          <h3 className="admin-card-title">{label}</h3>
          {TIERS.map(({ key, label: tierLabel }) => (
            <div key={key} className="admin-group">
              <div className="admin-group-head">
                <span className="admin-group-label">{tierLabel}</span>
                <button className="admin-btn-ghost" onClick={() => addRow(node, key)}>+ 加一条</button>
              </div>
              {textsFor(node, key).length === 0 && (
                <div className="admin-group-empty">（空 · 使用内置文案池）</div>
              )}
              {textsFor(node, key).map((text, i) => (
                <div key={i} className="admin-row">
                  <AutoTextarea
                    value={text}
                    onChange={(e) => setText(node, key, i, e.target.value)}
                    minRows={2}
                    className="admin-input admin-textarea"
                  />
                  <button className="admin-btn-ghost admin-btn-danger" onClick={() => removeRow(node, key, i)}>删</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      <div className="admin-savebar">
        <button className="admin-btn-primary" onClick={save} disabled={saving}>{saving ? "保存中..." : "保存全部"}</button>
        <button className="admin-btn-ghost" onClick={resetToBuiltin} disabled={saving}>重置为内置文案</button>
        {msg && <span style={{ fontSize: "0.75rem", color: msg.ok ? "#4ade80" : "#ef4444" }}>{msg.text}</span>}
      </div>
    </div>
  );
}
