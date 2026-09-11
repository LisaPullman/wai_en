import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AudioUnlock } from "@/components/common/common";
import { SiteLock } from "@/components/common/SiteLock";
import { TabBar as TabBarNav } from "@/components/common/TabBar";

export const metadata: Metadata = {
  title: "外恩英语乐园 WaiEn English",
  description: "给一年级小朋友的英语听说读乐园：课程、单词卡、故事、游戏和日常300句",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "外恩英语乐园" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#eaf6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <AudioUnlock />
        <SiteLock>
          {children}
          <TabBarNav />
        </SiteLock>
      </body>
    </html>
  );
}
