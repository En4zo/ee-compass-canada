import { describe, it, expect } from "vitest";
import { calculateCRS } from "@/features/crs/calculate";
import { defaultApplicant, type Applicant } from "@/features/crs/schema";
const score = (overrides: Partial<Applicant> = {}) =>
  calculateCRS({ ...defaultApplicant, ...overrides });
// 期望值按 IRCC 的各项表格手工相加；不从被测函数反推。
describe("CRS official-table examples", () => {
  it("single, age 29, bachelor, CLB9, one Canadian year = 432", () => {
    const r = score();
    expect(r.core).toBe(394);
    expect(r.transfer).toBe(38);
    expect(r.total).toBe(432);
  });
  it("accompanying partner reduces primary tables", () => {
    const r = score({ partnerStatus: "accompanying" });
    expect(r.core).toBe(363);
    expect(r.transfer).toBe(38);
    expect(r.total).toBe(401);
  });
  it.each(["notAccompanying", "citizen"] as const)(
    "%s uses without-spouse tables",
    (partnerStatus) =>
      expect(
        score({
          partnerStatus,
          spouseEducation: "doctorate",
          spouseLanguage: [12, 12, 12, 12],
          spouseYears: 5,
        }).total,
      ).toBe(432),
  );
  it.each([
    [17, 0],
    [18, 99],
    [19, 105],
    [20, 110],
    [29, 110],
    [30, 105],
    [40, 50],
    [41, 39],
    [44, 6],
    [45, 0],
  ])("age %i gets %i", (age, expected) =>
    expect(score({ age }).details.age).toBe(expected),
  );
  it("one language skill below threshold limits transfers", () => {
    expect(
      score({ first: [9, 9, 9, 6], foreignYears: 3, canadianYears: 0 })
        .transfer,
    ).toBe(0);
    expect(
      score({ first: [9, 9, 9, 7], foreignYears: 3, canadianYears: 0 })
        .transfer,
    ).toBe(38);
  });
  it("caps second language for accompanying partner at 22", () =>
    expect(
      score({ partnerStatus: "accompanying", second: [12, 12, 12, 12] }).details
        .secondLanguage,
    ).toBe(22));
  it("caps spouse factors at 40", () =>
    expect(
      score({
        partnerStatus: "accompanying",
        spouseEducation: "doctorate",
        spouseLanguage: [9, 9, 9, 9],
        spouseYears: 5,
      }).partner,
    ).toBe(40));
  it("caps transfer groups at 50 and sum at 100", () => {
    const r = score({
      education: "master",
      foreignYears: 3,
      canadianYears: 2,
      tradeCertificate: true,
    });
    expect(r.details.educationTransfer).toBe(50);
    expect(r.details.foreignTransfer).toBe(50);
    expect(r.details.certificateTransfer).toBe(50);
    expect(r.transfer).toBe(100);
  });
  it("trade certificate thresholds", () => {
    expect(
      score({ tradeCertificate: true, first: [5, 5, 5, 5] }).details
        .certificateTransfer,
    ).toBe(25);
    expect(
      score({ tradeCertificate: true, first: [5, 5, 5, 4] }).details
        .certificateTransfer,
    ).toBe(0);
  });
  it("French bonus works when French is either language", () => {
    expect(score({ second: [7, 7, 7, 7] }).details.frenchBonus).toBe(50);
    expect(
      score({
        firstLanguage: "french",
        first: [7, 7, 7, 7],
        second: [0, 0, 0, 0],
      }).details.frenchBonus,
    ).toBe(25);
    expect(score({ second: [7, 7, 7, 6] }).details.frenchBonus).toBe(0);
  });
  it("caps nomination plus other extras at 600", () =>
    expect(
      score({
        nomination: true,
        sibling: true,
        canadianEducation: 30,
        second: [9, 9, 9, 9],
      }).additional,
    ).toBe(600));
  it("maximum eligible inputs reach 1200", () =>
    expect(
      score({
        education: "doctorate",
        first: [12, 12, 12, 12],
        second: [12, 12, 12, 12],
        canadianYears: 5,
        foreignYears: 3,
        nomination: true,
      }).total,
    ).toBe(1200));
  it("rejects invalid numeric input", () => {
    expect(() => score({ age: NaN })).toThrow();
    expect(() => score({ first: [13, 9, 9, 9] })).toThrow();
    expect(() => score({ age: 29.5 })).toThrow();
  });
});
