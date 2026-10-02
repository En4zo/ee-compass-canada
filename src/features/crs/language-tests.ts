export const LANGUAGE_TEST_SOURCE =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html";

export const LANGUAGE_TESTS = [
  "direct",
  "ielts",
  "celpip",
  "pte",
  "tef",
  "tcf",
] as const;

export type LanguageTest = (typeof LANGUAGE_TESTS)[number];
export type LanguageAbility = "listening" | "speaking" | "reading" | "writing";
export type LanguageScores = [number, number, number, number];

export const LANGUAGE_ABILITIES: LanguageAbility[] = [
  "listening",
  "speaking",
  "reading",
  "writing",
];

export const TEST_LABELS: Record<LanguageTest, string> = {
  direct: "CLB / NCLC",
  ielts: "IELTS General Training",
  celpip: "CELPIP-General",
  pte: "PTE Core",
  tef: "TEF Canada",
  tcf: "TCF Canada",
};

export function testsForLanguage(language: "english" | "french") {
  return language === "english"
    ? (["direct", "ielts", "celpip", "pte"] as const)
    : (["direct", "tef", "tcf"] as const);
}

type ThresholdTable = Record<LanguageAbility, readonly [number, number][]>;

// 表中每一行是 [考试原始分最低值, CLB/NCLC 等级]，按最低值从高到低匹配。
const TABLES: Record<
  Exclude<LanguageTest, "direct" | "celpip">,
  ThresholdTable
> = {
  ielts: {
    listening: [
      [8.5, 10],
      [8, 9],
      [7.5, 8],
      [6, 7],
      [5.5, 6],
      [5, 5],
      [4.5, 4],
    ],
    speaking: [
      [7.5, 10],
      [7, 9],
      [6.5, 8],
      [6, 7],
      [5.5, 6],
      [5, 5],
      [4, 4],
    ],
    reading: [
      [8, 10],
      [7, 9],
      [6.5, 8],
      [6, 7],
      [5, 6],
      [4, 5],
      [3.5, 4],
    ],
    writing: [
      [7.5, 10],
      [7, 9],
      [6.5, 8],
      [6, 7],
      [5.5, 6],
      [5, 5],
      [4, 4],
    ],
  },
  pte: {
    listening: [
      [89, 10],
      [82, 9],
      [71, 8],
      [60, 7],
      [50, 6],
      [39, 5],
      [28, 4],
    ],
    speaking: [
      [89, 10],
      [84, 9],
      [76, 8],
      [68, 7],
      [59, 6],
      [51, 5],
      [42, 4],
    ],
    reading: [
      [88, 10],
      [78, 9],
      [69, 8],
      [60, 7],
      [51, 6],
      [42, 5],
      [33, 4],
    ],
    writing: [
      [90, 10],
      [88, 9],
      [79, 8],
      [69, 7],
      [60, 6],
      [51, 5],
      [41, 4],
    ],
  },
  tef: {
    listening: [
      [316, 10],
      [298, 9],
      [280, 8],
      [249, 7],
      [217, 6],
      [181, 5],
      [145, 4],
    ],
    speaking: [
      [393, 10],
      [371, 9],
      [349, 8],
      [310, 7],
      [271, 6],
      [226, 5],
      [181, 4],
    ],
    reading: [
      [263, 10],
      [248, 9],
      [233, 8],
      [207, 7],
      [181, 6],
      [151, 5],
      [121, 4],
    ],
    writing: [
      [393, 10],
      [371, 9],
      [349, 8],
      [310, 7],
      [271, 6],
      [226, 5],
      [181, 4],
    ],
  },
  tcf: {
    listening: [
      [549, 10],
      [523, 9],
      [503, 8],
      [458, 7],
      [398, 6],
      [369, 5],
      [331, 4],
    ],
    speaking: [
      [16, 10],
      [14, 9],
      [12, 8],
      [10, 7],
      [7, 6],
      [6, 5],
      [4, 4],
    ],
    reading: [
      [549, 10],
      [524, 9],
      [499, 8],
      [453, 7],
      [406, 6],
      [375, 5],
      [342, 4],
    ],
    writing: [
      [16, 10],
      [14, 9],
      [12, 8],
      [10, 7],
      [7, 6],
      [6, 5],
      [4, 4],
    ],
  },
};

export function convertLanguageScore(
  test: LanguageTest,
  ability: LanguageAbility,
  rawScore: number,
) {
  if (!Number.isFinite(rawScore) || rawScore < 0) return 0;
  if (test === "direct" || test === "celpip") {
    return rawScore < 4 ? 0 : Math.min(12, Math.floor(rawScore));
  }
  return (
    TABLES[test][ability].find(([minimum]) => rawScore >= minimum)?.[1] ?? 0
  );
}

export function convertLanguageScores(
  test: LanguageTest,
  scores: LanguageScores,
): LanguageScores {
  return LANGUAGE_ABILITIES.map((ability, index) =>
    convertLanguageScore(test, ability, scores[index]),
  ) as LanguageScores;
}

export function scoreInputAttributes(
  test: LanguageTest,
  ability: LanguageAbility,
) {
  if (test === "ielts") return { min: 0, max: 9, step: 0.5 };
  if (test === "pte") return { min: 0, max: 90, step: 1 };
  if (test === "tef") {
    return {
      min: 0,
      max: ability === "listening" ? 360 : ability === "reading" ? 300 : 450,
      step: 1,
    };
  }
  if (test === "tcf") {
    return {
      min: 0,
      max: ability === "listening" || ability === "reading" ? 699 : 20,
      step: 1,
    };
  }
  return { min: 0, max: 12, step: 1 };
}
