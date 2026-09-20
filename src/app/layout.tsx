import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "EE Compass Canada | Express Entry 信息平台",
    template: "%s | EE Compass Canada",
  },
  description:
    "加拿大 Express Entry 抽选历史、CRS 自助评分与社区交流。Official draw data, a transparent CRS calculator, and community.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
