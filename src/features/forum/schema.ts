import { z } from "zod";
function isSecureSource(value: string, official = false) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (!official || /(^|\.)canada\.ca$/.test(url.hostname))
    );
  } catch {
    return false;
  }
}
export const postSchema = z
  .object({
    title: z.string().trim().min(5).max(160),
    body: z.string().trim().min(10).max(10000),
    topic: z.enum(["CEC", "PNP", "French", "CRS", "General"]),
    kind: z.enum(["official", "experience", "discussion"]),
    source_url: z
      .union([z.literal(""), z.url().refine((s) => isSecureSource(s))])
      .optional(),
  })
  .superRefine((p, ctx) => {
    if (
      p.kind === "official" &&
      (!p.source_url || !isSecureSource(p.source_url, true))
    )
      ctx.addIssue({
        code: "custom",
        path: ["source_url"],
        message: "Official references require a canada.ca source",
      });
  });
export const commentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
export type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  topic: string;
  kind: string;
  source_url: string | null;
  created_at: string;
  hidden: boolean;
  profiles: { display_name: string } | null;
};
export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  hidden: boolean;
  profiles: { display_name: string } | null;
};

export const topics = ["CEC", "PNP", "French", "CRS", "General"];
