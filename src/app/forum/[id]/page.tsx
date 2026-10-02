import { notFound } from "next/navigation";
import { z } from "zod";
import { getPost } from "@/features/forum/repository";
import { PostDetail } from "@/features/forum/forum";
export const dynamic = "force-dynamic";
export default async function Post({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id.startsWith("demo-") && !z.uuid().safeParse(id).success) notFound();
  const { post, comments } = await getPost(id);
  if (!post) notFound();
  return <PostDetail post={post} comments={comments} />;
}
