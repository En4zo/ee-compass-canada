"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserRound, ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers";
import { PageHeading } from "@/components/ui";
import { hasBackend } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";
import type { Post } from "@/features/forum/schema";
type Mode = "login" | "register" | "reset" | "update";
export function Account({
  name,
  posts,
  isAdmin = false,
  recovery = false,
  authError = false,
}: {
  name: string;
  posts: Post[];
  isAdmin?: boolean;
  recovery?: boolean;
  authError?: boolean;
}) {
  const { t, user, authLoading } = useI18n(),
    router = useRouter();
  const [mode, setMode] = useState<Mode>(recovery ? "update" : "login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [displayName, setDisplayName] = useState(name),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const c = createClient();
      let err;
      const callback = `${location.origin}/auth/callback`;
      if (mode === "login") {
        ({ error: err } = await c.auth.signInWithPassword({ email, password }));
      } else if (mode === "register") {
        ({ error: err } = await c.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback },
        }));
        if (!err)
          setMessage(
            t(
              "请检查邮箱并完成注册确认。",
              "Check your email to confirm your account.",
            ),
          );
      } else if (mode === "reset") {
        ({ error: err } = await c.auth.resetPasswordForEmail(email, {
          redirectTo: `${callback}?next=/account/reset`,
        }));
        if (!err)
          setMessage(
            t(
              "如果邮箱已注册，你将收到重置邮件。",
              "If the email is registered, you will receive a reset link.",
            ),
          );
      } else {
        ({ error: err } = await c.auth.updateUser({ password }));
        if (!err) {
          setMessage(t("密码已更新。", "Password updated."));
          setMode("login");
          router.replace("/account");
        }
      }
      if (err) throw err;
      router.refresh();
    } catch {
      setError(
        t(
          "操作失败。请检查邮箱、密码、确认邮件或稍后重试。",
          "Could not complete the request. Check your email, password and confirmation link, or try again later.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!r.ok) throw new Error();
      setMessage(t("昵称已保存。", "Display name saved."));
      router.refresh();
    } catch {
      setError(t("保存失败，请重试。", "Could not save. Please retry."));
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    const { error } = await createClient().auth.signOut();
    setBusy(false);
    if (error) {
      setError(t("退出失败，请重试。", "Could not sign out."));
      return;
    }
    router.refresh();
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR COMMUNITY SPACE"
        title={["我的账户", "My account"]}
        description={[
          "账户用于社区交流。你的 CRS 背景不会与账户关联。",
          "Your account is for the community. CRS answers are not linked to your profile.",
        ]}
      />
      {!hasBackend() ? (
        <div className="panel auth-card">
          <LockKeyhole size={34} />
          <h2>{t("账户功能尚未连接", "Accounts are not connected yet")}</h2>
          <p>
            {t(
              "当前无需注册即可查看抽选、计算 CRS 和浏览示例讨论。按照 README 配置 Supabase 后，即可启用真实账户。",
              "You can explore draws, calculate CRS and browse sample discussions. Follow the README to connect Supabase and enable real accounts.",
            )}
          </p>
          <Link className="button" href="/calculator">
            {t("先计算 CRS", "Calculate CRS")}
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : authLoading ? (
        <p role="status">{t("检查登录状态…", "Checking your session…")}</p>
      ) : user && mode !== "update" ? (
        <div className="account-grid">
          <section className="panel auth-card">
            <UserRound size={28} />
            <h2>{t("欢迎回来", "Welcome back")}</h2>
            <p className="muted">{user.email}</p>
            <form className="form-stack" onSubmit={saveName}>
              <label className="field">
                <span>{t("社区昵称", "Display name")}</span>
                <input
                  minLength={2}
                  maxLength={40}
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <button className="button" disabled={busy}>
                {t("保存昵称", "Save display name")}
              </button>
            </form>
            <button className="text-link" disabled={busy} onClick={signOut}>
              {t("退出登录", "Sign out")}
            </button>
            {isAdmin && (
              <Link href="/admin" className="text-link">
                {t("进入管理中心", "Open administration")} →
              </Link>
            )}
          </section>
          <section className="panel own-posts">
            <h2>{t("我的讨论", "My discussions")}</h2>
            {posts.map((p) => (
              <Link key={p.id} href={`/forum/${p.id}`}>
                <strong>{p.title}</strong>
                <span>
                  {p.created_at.slice(0, 10)}{" "}
                  {p.hidden && t("· 已隐藏", "· Hidden")}
                </span>
              </Link>
            ))}
            {!posts.length && (
              <p className="muted">
                {t("你还没有发布讨论。", "You haven’t posted yet.")}
              </p>
            )}
            <Link className="button secondary" href="/forum/new">
              {t("发起讨论", "Start a discussion")}
            </Link>
          </section>
        </div>
      ) : (
        <div className="panel auth-card">
          <LockKeyhole size={30} />
          <h2>
            {mode === "update"
              ? t("设置新密码", "Set a new password")
              : mode === "reset"
                ? t("重置密码", "Reset password")
                : mode === "register"
                  ? t("加入社区", "Join the community")
                  : t("欢迎回来", "Welcome back")}
          </h2>
          <form onSubmit={submit} className="form-stack">
            {mode !== "update" && (
              <label className="field">
                <span>{t("邮箱", "Email")}</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {mode !== "reset" && (
              <label className="field">
                <span>
                  {t("密码（至少 8 位）", "Password (at least 8 characters)")}
                </span>
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? t("处理中…", "Working…")
                : mode === "login"
                  ? t("登录", "Sign in")
                  : mode === "register"
                    ? t("注册", "Register")
                    : mode === "reset"
                      ? t("发送重置邮件", "Send reset email")
                      : t("更新密码", "Update password")}
            </button>
          </form>
          <div className="inline-actions">
            {(["login", "register", "reset"] as const)
              .filter((v) => v !== mode)
              .map((v) => (
                <button
                  className="text-link"
                  key={v}
                  onClick={() => {
                    setMode(v);
                    setError("");
                    setMessage("");
                  }}
                >
                  {v === "login"
                    ? t("返回登录", "Sign in")
                    : v === "register"
                      ? t("创建账户", "Create account")
                      : t("忘记密码？", "Forgot password?")}
                </button>
              ))}
          </div>
        </div>
      )}
      {authError && (
        <p className="error-message" role="alert">
          {t(
            "邮件链接无效或已过期。请在发起请求的浏览器中重新申请并打开邮件链接。",
            "The email link is invalid or expired. Request a new link and open it in the same browser.",
          )}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
