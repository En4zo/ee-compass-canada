import { applicantSchema, type Applicant } from "./schema";
import {
  agePoints,
  educationPoints,
  experiencePoints,
  EDUCATION,
  RULE_SOURCE,
  RULE_VERSION,
} from "./rules";
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
function firstLanguagePoints(level: number, spouse: boolean) {
  if (level < 4) return 0;
  return (spouse ? [6, 6, 8, 16, 22, 29, 32] : [6, 6, 9, 17, 23, 31, 34])[
    Math.min(level, 10) - 4
  ];
}
function secondLanguagePoints(level: number) {
  return level < 5 ? 0 : level < 7 ? 1 : level < 9 ? 3 : 6;
}
// 技能转移的学历和海外经验分别封顶 50，所有组合合计封顶 100。
function combination(tier: number, strength: number) {
  return !tier || !strength
    ? 0
    : tier === 1 && strength === 1
      ? 13
      : tier === 2 && strength === 2
        ? 50
        : 25;
}
export function calculateCRS(input: Applicant) {
  const a = applicantSchema.parse(input);
  const spouse = a.partnerStatus === "accompanying";
  const mode = spouse ? "spouse" : "single";
  const educationIndex = EDUCATION.indexOf(a.education);
  const age =
    a.age < 18 || a.age >= 45
      ? 0
      : a.age === 18
        ? spouse
          ? 90
          : 99
        : a.age === 19
          ? spouse
            ? 95
            : 105
          : agePoints[mode][Math.max(0, a.age - 29)];
  const education = educationPoints[mode][educationIndex];
  const firstLanguage = sum(a.first.map((n) => firstLanguagePoints(n, spouse)));
  const secondLanguage = Math.min(
    spouse ? 22 : 24,
    sum(a.second.map(secondLanguagePoints)),
  );
  const work = experiencePoints[mode][a.canadianYears];
  const partnerEducation = spouse
    ? educationPoints.partner[EDUCATION.indexOf(a.spouseEducation)]
    : 0;
  const partnerLanguage = spouse
    ? sum(a.spouseLanguage.map((n) => (n < 5 ? 0 : n < 7 ? 1 : n < 9 ? 3 : 5)))
    : 0;
  const partnerWork = spouse ? experiencePoints.partner[a.spouseYears] : 0;
  const minLanguage = Math.min(...a.first);
  const languageStrength = minLanguage >= 9 ? 2 : minLanguage >= 7 ? 1 : 0;
  const workStrength = Math.min(a.canadianYears, 2);
  const educationTier = educationIndex < 2 ? 0 : educationIndex < 5 ? 1 : 2;
  const foreignTier = a.foreignYears === 0 ? 0 : a.foreignYears < 3 ? 1 : 2;
  const educationTransfer = Math.min(
    50,
    combination(educationTier, languageStrength) +
      combination(educationTier, workStrength),
  );
  const foreignTransfer = Math.min(
    50,
    combination(foreignTier, languageStrength) +
      combination(foreignTier, workStrength),
  );
  const certificateTransfer = a.tradeCertificate
    ? minLanguage >= 7
      ? 50
      : minLanguage >= 5
        ? 25
        : 0
    : 0;
  const english = a.firstLanguage === "english" ? a.first : a.second;
  const french = a.firstLanguage === "french" ? a.first : a.second;
  const frenchBonus =
    Math.min(...french) >= 7 ? (Math.min(...english) >= 5 ? 50 : 25) : 0;
  const core = age + education + firstLanguage + secondLanguage + work;
  const partner = partnerEducation + partnerLanguage + partnerWork;
  const transfer = Math.min(
    100,
    educationTransfer + foreignTransfer + certificateTransfer,
  );
  const additional = Math.min(
    600,
    (a.nomination ? 600 : 0) +
      (a.sibling ? 15 : 0) +
      a.canadianEducation +
      frenchBonus,
  );
  return {
    total: core + partner + transfer + additional,
    core,
    partner,
    transfer,
    additional,
    details: {
      age,
      education,
      firstLanguage,
      secondLanguage,
      work,
      partnerEducation,
      partnerLanguage,
      partnerWork,
      educationTransfer,
      foreignTransfer,
      certificateTransfer,
      frenchBonus,
      nomination: a.nomination ? 600 : 0,
      sibling: a.sibling ? 15 : 0,
      canadianEducation: a.canadianEducation,
    },
    version: RULE_VERSION,
    source: RULE_SOURCE,
  };
}
export type CRSResult = ReturnType<typeof calculateCRS>;
