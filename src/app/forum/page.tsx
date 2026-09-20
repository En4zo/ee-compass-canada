import { getPosts } from "@/features/forum/repository";
import { ForumList } from "@/features/forum/forum";
export const dynamic = "force-dynamic";
export default async function Forum() {
  return <ForumList posts={await getPosts()} />;
}
