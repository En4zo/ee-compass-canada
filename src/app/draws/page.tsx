import { getDraws } from "@/features/draws/repository";
import { DrawExplorer } from "@/features/draws/explorer";
import { DataStamp } from "@/features/draws/dashboard";
import { PageHeading } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function Draws() {
  const data = await getDraws();
  return (
    <>
      <PageHeading
        eyebrow="THE OFFICIAL RECORD"
        title={["历史抽选", "Draw history"]}
        description={[
          "在相同轮次类别中比较分数，保留每条数据的来源与上下文。",
          "Compare like-for-like rounds, with the source and context behind every record.",
        ]}
      />
      <DataStamp data={data} />
      <DrawExplorer draws={data.draws} />
    </>
  );
}
