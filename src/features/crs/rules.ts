// 与界面解耦的评分表。更新政策时新增版本并补充回归案例。
export const RULE_VERSION = "IRCC-2025-03-25-reviewed-2026-09-18";
export const RULE_SOURCE =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html";
export const EDUCATION = [
  "none",
  "secondary",
  "oneYear",
  "twoYear",
  "bachelor",
  "twoCredentials",
  "master",
  "doctorate",
] as const;
export const educationPoints = {
  single: [0, 30, 90, 98, 120, 128, 135, 150],
  spouse: [0, 28, 84, 91, 112, 119, 126, 140],
  partner: [0, 2, 6, 7, 8, 9, 10, 10],
};
export const agePoints = {
  single: [110, 105, 99, 94, 88, 83, 77, 72, 66, 61, 55, 50, 39, 28, 17, 6],
  spouse: [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 35, 25, 15, 5],
};
export const experiencePoints = {
  single: [0, 40, 53, 64, 72, 80],
  spouse: [0, 35, 46, 56, 63, 70],
  partner: [0, 5, 7, 8, 9, 10],
};
