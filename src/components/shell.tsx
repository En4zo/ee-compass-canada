"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  ChartNoAxesCombined,
  Calculator,
  MessagesSquare,
  ArrowUpRight,
  Globe2,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "./providers";
import { navigation } from "@/messages/navigation";
import { hasBackend } from "@/lib/env";
const links = [
  { path: "/", key: "dashboard", icon: LayoutDashboard },
  { path: "/draws", key: "draws", icon: ChartNoAxesCombined },
  { path: "/calculator", key: "calculator", icon: Calculator },
  { path: "/forum", key: "forum", icon: MessagesSquare },
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t, user } = useI18n();
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t("跳至主要内容", "Skip to content")}
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="EE Compass Canada">
          <span className="brand-icon">
            <Compass size={29} />
          </span>
          <span>
            EE Compass<small>CANADA</small>
          </span>
        </Link>
        <div className="nav-caption">EXPRESS ENTRY</div>
        <nav aria-label={t("主导航", "Main navigation")}>
          {links.map(({ path, key, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={`nav-item ${pathname === path || (path !== "/" && pathname.startsWith(path)) ? "active" : ""}`}
            >
              <Icon size={19} />
              {navigation[language][key]}
              {pathname === path && <span className="active-mark" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={22} />
          <strong>
            {t("信息有据，前路有向", "Clarity for your next chapter")}
          </strong>
          <p>
            {t(
              "从官方数据出发，理解自己的每一步。",
              "Official data. A clearer view of your journey.",
            )}
          </p>
          <a
            href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html"
            target="_blank"
            rel="noreferrer"
          >
            IRCC {t("官方网站", "official website")}
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <span className="small-caps">INDEPENDENT · COMMUNITY FIRST</span>
          <span>EE Compass Canada © 2026</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            {t("你的 Express Entry 信息空间", "Your Express Entry workspace")}
          </span>
          <div className="topbar-actions">
            <button
              className="language-button"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              aria-label={t("切换为英文", "Switch to Chinese")}
            >
              <Globe2 size={16} />
              {language === "zh" ? "EN" : "中文"}
            </button>
            <Link href="/account" className="account-link">
              <UserRound size={17} />
              <span>
                {user
                  ? t("我的账户", "My account")
                  : t("登录 / 注册", "Sign in")}
              </span>
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {!hasBackend() && (
            <div className="demo-banner">
              <span>{t("预览模式", "PREVIEW")}</span>
              {t(
                "官方历史快照 · 社区内容为示例 · 接入 Supabase 后启用账户与发布",
                "Official data snapshot · Sample community posts · Connect Supabase to enable accounts and publishing",
              )}
            </div>
          )}
          {children}
        </main>
        <footer>
          <span>
            {t(
              "独立信息平台，非加拿大政府网站。",
              "An independent platform, not a Government of Canada website.",
            )}
          </span>
          <span>
            {t(
              "历史比较不代表未来邀请结果。",
              "Historical comparisons do not predict future invitations.",
            )}
          </span>
        </footer>
      </div>
    </div>
  );
}
