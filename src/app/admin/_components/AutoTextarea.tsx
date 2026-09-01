"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ChangeEvent } from "react";

/**
 * AutoTextarea — 内容几行，框就几行高。
 * 手机后台编辑的核心修复：答案/描述这类多行文案不再被 rows=2 的固定小框截断，
 * 输入时随内容自动长高，全文始终可见。
 */
export default function AutoTextarea({
  value,
  onChange,
  minRows = 2,
  className,
  style,
  ...rest
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  minRows?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "rows">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={onChange}
      className={className}
      style={{ resize: "vertical", overflow: "hidden", ...style }}
      {...rest}
    />
  );
}
