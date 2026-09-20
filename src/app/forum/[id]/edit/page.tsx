import { notFound } from "next/navigation";
import { z } from "zod";
import { getPost } from "@/features/forum/repository";
import { PostEditor } from "@/features/forum/forum";
export const dynamic = "force-dynamic";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { post } = await getPost(id);
  if (!post) notFound();
  return <PostEditor post={post} />;
}
