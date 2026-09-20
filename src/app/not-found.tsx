import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel empty-state">
      <h1>404</h1>
      <p>页面不存在 / Page not found</p>
      <Link className="button" href="/">
        返回首页 / Go home
      </Link>
    </section>
  );
}
