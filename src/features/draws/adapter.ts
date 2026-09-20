import { z } from "zod";
export const IRCC_DATA_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";
export const IRCC_ROUNDS_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html";
export type Draw = {
  draw_number: string;
  date: string;
  round_type: string;
  invitations: number;
  crs: number;
  tie_breaking: string | null;
  source_url: string;
};
const integerText = z
  .string()
  .regex(/^\d[\d,]*$/)
  .transform((v) => Number(v.replaceAll(",", "")));
const rawDraw = z.object({
  drawNumber: z.string().regex(/^\d+[a-z]?$/),
  drawDate: z.iso.date(),
  drawName: z.string().trim().min(1),
  drawSize: integerText.pipe(z.number().int().positive()),
  drawCRS: integerText.pipe(z.number().int().min(0).max(1200)),
  drawCutOff: z.string().optional(),
});
export function parseDraws(payload: unknown, now = new Date()): Draw[] {
  const { rounds } = z
    .object({ rounds: z.array(rawDraw).min(1) })
    .parse(payload);
  const seen = new Set<string>();
  return rounds
    .map((r) => {
      if (seen.has(r.drawNumber)) throw new Error("Duplicate draw number");
      if (r.drawDate > now.toISOString().slice(0, 10))
        throw new Error("Future draw date");
      seen.add(r.drawNumber);
      // 早期抽选没有 tie-breaking rule；保留空值，绝不编造日期。
      return {
        draw_number: r.drawNumber,
        date: r.drawDate,
        round_type: r.drawName,
        invitations: r.drawSize,
        crs: r.drawCRS,
        tie_breaking: r.drawCutOff?.trim() || null,
        source_url: `https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds/invitations.html?q=${r.drawNumber}`,
      };
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.draw_number.localeCompare(a.draw_number, undefined, {
          numeric: true,
        }),
    );
}
export async function fetchOfficialDraws(fetcher: typeof fetch = fetch) {
  const response = await fetcher(IRCC_DATA_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`IRCC HTTP ${response.status}`);
  return parseDraws(await response.json());
}
export function shortRound(type: string) {
  return type === "Canadian Experience Class"
    ? "CEC"
    : type === "Provincial Nominee Program"
      ? "PNP"
      : type.replace(/,? 20\d{2}[- ]Version.*$/i, "");
}
