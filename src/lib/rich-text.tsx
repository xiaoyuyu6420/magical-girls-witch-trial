"use client";

import { Fragment, type ReactNode } from "react";

/**
 * 极简富文本：让题干能表达"断言 → 低语 → 重击"的视觉层次。
 *
 * 标记（向后兼容，无标记的纯文本原样返回）：
 *   **核心一刀**  → .rich-punch  （金色、加粗、略放大——审判官最狠的那句）
 *   *低语*        → .rich-whisper（暗色、斜体、略缩小——凑近耳边的揭穿）
 *   \n            → 段落分隔（由 .q-text 的 white-space: pre-line 渲染）
 *
 * 不处理嵌套（** 内含 * 不拆分）。中文文案里不会出现裸 *，标记安全。
 */
const RICH_RE = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

export function renderRichText(text: string | undefined | null): ReactNode {
  if (!text || (!text.includes("**") && !text.includes("*"))) return text ?? null;
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  RICH_RE.lastIndex = 0;
  while ((m = RICH_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      out.push(<span key={i++} className="rich-punch">{m[1]}</span>);
    } else if (m[2] !== undefined) {
      out.push(<span key={i++} className="rich-whisper">{m[2]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}
