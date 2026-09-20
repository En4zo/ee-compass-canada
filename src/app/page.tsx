import { getDraws } from "@/features/draws/repository";
import { getPosts } from "@/features/forum/repository";
import { Dashboard } from "@/features/draws/dashboard";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [data, forum] = await Promise.all([
    getDraws(),
    getPosts()
      .then((posts) => ({ posts, failed: false }))
      .catch(() => ({ posts: [], failed: true })),
  ]);
  return (
    <Dashboard
      data={data}
      posts={forum.posts}
      forumUnavailable={forum.failed}
    />
  );
}
