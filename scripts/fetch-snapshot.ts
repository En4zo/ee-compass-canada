import { writeFile } from "node:fs/promises";
import {
  fetchOfficialDraws,
  IRCC_DATA_URL,
} from "../src/features/draws/adapter";
const draws = await fetchOfficialDraws();
await writeFile(
  new URL("../src/data/draws.json", import.meta.url),
  JSON.stringify(
    { fetchedAt: new Date().toISOString(), source: IRCC_DATA_URL, draws },
    null,
    2,
  ),
);
console.log(`Saved ${draws.length} official draws.`);
