"use client";

import { useI18n } from "@/lib/i18n";

/**
 * 全站合规声明 footer（R9/A6）。
 * 同人二创 + 非官方，与原作版权方无隶属关系。
 */
export default function DisclaimerFooter() {
  const { t } = useI18n();
  return (
    <footer
      style={{
        padding: "0.8rem 1rem 1.2rem",
        textAlign: "center",
        fontSize: "0.65rem",
        letterSpacing: "0.05em",
        color: "rgba(255,255,255,0.3)",
        lineHeight: 1.6,
        fontFamily: "var(--f-title)",
      }}
    >
      {t("disclaimer.footer")}
    </footer>
  );
}
