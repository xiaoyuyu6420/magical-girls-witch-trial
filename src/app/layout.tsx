import type { Metadata, Viewport } from "next";
import { Noto_Serif_SC } from "next/font/google";
import { Cinzel } from "next/font/google";
import { Syne } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AppShell from "@/components/AppShell";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import { DocumentLang } from "@/components/DocumentLang";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "500", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030303",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://witch-trial.vercel.app"), // replace with prod domain before launch
  title: "魔女审判 | WITCH TRIAL — 魔法少女人格测试",
  description: "26 道情境题，卸下伪装照见真实的自己。测测你最像哪位魔法少女——晓美焰、鹿目圆、沙耶香、杏子，还是清醒的审判者艾玛？",
  keywords: ["魔女审判", "人格测试", "魔法少女", "性格测试", "Witch Trial", "personality test", "MBTI"],
  authors: [{ name: "Witch Trial" }],
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: "魔女审判 | WITCH TRIAL",
    description: "卸下伪装，测测你最像哪位魔法少女。",
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["zh_TW", "en_US", "ja_JP"],
    siteName: "Witch Trial",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "WITCH TRIAL 魔女审判" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "魔女审判 | WITCH TRIAL",
    description: "卸下伪装，测测你最像哪位魔法少女。",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "魔女审判",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSerif.variable} ${cinzel.variable} ${syne.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-serif)]">
        <DocumentLang />
        <GoogleAnalytics />
        <AppShell>
          {children}
          <DisclaimerFooter />
        </AppShell>
      </body>
    </html>
  );
}
