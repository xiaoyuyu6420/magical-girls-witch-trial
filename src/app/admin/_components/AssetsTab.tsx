"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";

type Rec = Record<string, any>;

/**
 * 素材库 tab：角色立绘上传替换 / 恢复内置 / 下载；
 * 下方「全量备份」：内容 JSON 导出 + 导入恢复（题目+角色+批注，含全部语言）。
 */
export default function AssetsTab({ api }: { api: (path: string, opts?: RequestInit) => Promise<Response> }) {
  const [assets, setAssets] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploadCode, setUploadCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/assets");
      setAssets(await res.json());
    } catch { } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { queueMicrotask(() => { void fetchAssets(); }); }, [fetchAssets]);

  const pickUpload = (code: string) => {
    setUploadCode(code);
    fileRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadCode) return;
    setBusy(uploadCode);
    setMsg(null);
    try {
      const tk = sessionStorage.getItem("admin-token") || "";
      const fd = new FormData();
      fd.append("code", uploadCode);
      fd.append("file", file);
      const res = await fetch("/api/admin/assets", { method: "POST", headers: { "x-admin-token": tk }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setMsg({ text: `${uploadCode} 已替换`, ok: true });
      fetchAssets();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "上传失败", ok: false });
    } finally {
      setBusy("");
      e.target.value = "";
    }
  };

  const resetAsset = async (code: string) => {
    setBusy(code);
    setMsg(null);
    try {
      const res = await api(`/assets?code=${code}`, { method: "DELETE" });
      if (!res.ok) throw new Error("恢复失败");
      setMsg({ text: `${code} 已恢复内置图`, ok: true });
      fetchAssets();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "恢复失败", ok: false });
    } finally { setBusy(""); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("backup");
    setMsg(null);
    try {
      const text = await file.text();
      const res = await api("/backup", { method: "POST", body: text });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "导入失败");
      setMsg({ text: `恢复完成：题目 ${data.questionsUpdated}（跳过 ${data.questionsSkipped}）、角色 ${data.types}`, ok: true });
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "导入失败", ok: false });
    } finally {
      setBusy("");
      e.target.value = "";
    }
  };

  if (loading) return <div style={{ color: "rgba(255,255,255,0.3)" }}>加载中...</div>;

  return (
    <div className="admin-tab">
      <p className="admin-hint">
        角色立绘用于结果页档案卡。替换图存服务器数据卷（安全持久）；「恢复内置」回退镜像自带底图。JPG / PNG / WebP，≤5MB。
      </p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: "none" }} />
      <div className="asset-grid">
        {assets.map((a) => (
          <div key={a.code as string} className="asset-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url as string} alt={a.code as string} className="asset-img" loading="lazy" />
            <div className="asset-code">
              {a.code as string}
              {(a.replaced as boolean) && <span className="asset-badge">已替换</span>}
            </div>
            <div className="asset-actions">
              <button className="admin-btn-ghost" disabled={busy === a.code} onClick={() => pickUpload(a.code as string)}>
                {busy === a.code ? "…" : "上传替换"}
              </button>
              <a className="admin-btn-ghost" href={a.url as string} download={`${a.code}.jpg`}>下载</a>
              {(a.replaced as boolean) && (
                <button className="admin-btn-ghost admin-btn-danger" disabled={busy === a.code} onClick={() => resetAsset(a.code as string)}>恢复内置</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card admin-backup">
        <h3 className="admin-card-title">全量备份（JSON）</h3>
        <p className="admin-hint">题目 + 角色 + 批注，含全部语言。导入按题号对位覆盖——先导出留存当前版本。</p>
        <div className="admin-savebar">
          <a className="admin-btn-primary" href="/api/admin/backup" download>导出备份</a>
          <button className="admin-btn-ghost" disabled={busy === "backup"} onClick={() => importRef.current?.click()}>
            {busy === "backup" ? "恢复中…" : "导入恢复"}
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={handleImport} style={{ display: "none" }} />
        </div>
      </div>

      {msg && <div style={{ fontSize: "0.8rem", color: msg.ok ? "#4ade80" : "#ef4444", marginTop: "0.75rem" }}>{msg.text}</div>}
    </div>
  );
}
