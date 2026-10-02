import { fetchOfficialDraws, type Draw } from "./adapter";
// 用依赖注入测试失败和幂等行为，采集层不直接依赖 UI 或数据库 SDK。
export async function synchronize(
  importBatch: (draws: Draw[]) => Promise<number>,
  recordFailure: (reason: string) => Promise<void>,
  fetcher: typeof fetch = fetch,
) {
  try {
    const draws = await fetchOfficialDraws(fetcher);
    return await importBatch(draws);
  } catch (error) {
    await recordFailure(
      error instanceof Error ? error.message : "Unknown sync failure",
    );
    throw error;
  }
}
