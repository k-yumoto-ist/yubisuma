import type { Metadata, Viewport } from "next";
import "./globals.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "指スマ ARENA | 指先で読むカジュアル対戦",
  description: "オリジナルキャラクターと遊ぶ、テンポのよい指スマ対戦ゲーム。",
  applicationName: "指スマ ARENA",
  keywords: ["指スマ", "ブラウザゲーム", "対戦ゲーム", "カジュアルゲーム"],
  manifest: `${publicBasePath}/manifest.webmanifest`,
  icons: {
    icon: `${publicBasePath}/icon.svg`
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#11182d"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
