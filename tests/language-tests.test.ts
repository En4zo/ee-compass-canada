import { describe, expect, it } from "vitest";
import {
  convertLanguageScore,
  convertLanguageScores,
} from "@/features/crs/language-tests";

describe("official language test conversions", () => {
  it("converts IELTS General 8/7/7/7 to CLB 9 in all abilities", () => {
    expect(convertLanguageScores("ielts", [8, 7, 7, 7])).toEqual([9, 9, 9, 9]);
  });

  it("uses ability-specific IELTS boundaries", () => {
    expect(convertLanguageScores("ielts", [7.5, 6.5, 6.5, 6.5])).toEqual([
      8, 8, 8, 8,
    ]);
    expect(convertLanguageScores("ielts", [4.5, 4, 3.5, 4])).toEqual([
      4, 4, 4, 4,
    ]);
  });

  it("converts PTE Core scores at the CLB 9 boundaries", () => {
    expect(convertLanguageScores("pte", [82, 84, 78, 88])).toEqual([
      9, 9, 9, 9,
    ]);
  });

  it("converts TEF Canada previous-score equivalencies", () => {
    expect(convertLanguageScores("tef", [298, 371, 248, 371])).toEqual([
      9, 9, 9, 9,
    ]);
  });

  it("converts TCF Canada scores at the NCLC 9 boundaries", () => {
    expect(convertLanguageScores("tcf", [523, 14, 524, 14])).toEqual([
      9, 9, 9, 9,
    ]);
  });

  it("treats results below CLB/NCLC 4 as zero for CRS", () => {
    expect(convertLanguageScore("ielts", "listening", 4)).toBe(0);
    expect(convertLanguageScore("pte", "writing", 40)).toBe(0);
    expect(convertLanguageScore("tef", "reading", 120)).toBe(0);
    expect(convertLanguageScore("tcf", "speaking", 3)).toBe(0);
  });

  it("maps CELPIP and direct levels while capping the displayed level", () => {
    expect(convertLanguageScores("celpip", [12, 10, 9, 3])).toEqual([
      12, 10, 9, 0,
    ]);
    expect(convertLanguageScore("direct", "reading", 15)).toBe(12);
  });
});
