import { z } from "zod";
import { EDUCATION } from "./rules";
const level = z.number().int().min(0).max(12);
const language = z.tuple([level, level, level, level]);
export const applicantSchema = z.object({
  age: z.number().int().min(0).max(100),
  partnerStatus: z.enum([
    "single",
    "accompanying",
    "notAccompanying",
    "citizen",
  ]),
  education: z.enum(EDUCATION),
  firstLanguage: z.enum(["english", "french"]),
  first: language,
  second: language,
  canadianYears: z.number().int().min(0).max(5),
  foreignYears: z.number().int().min(0).max(3),
  spouseEducation: z.enum(EDUCATION),
  spouseLanguage: language,
  spouseYears: z.number().int().min(0).max(5),
  nomination: z.boolean(),
  sibling: z.boolean(),
  canadianEducation: z.union([z.literal(0), z.literal(15), z.literal(30)]),
  tradeCertificate: z.boolean(),
});
export type Applicant = z.infer<typeof applicantSchema>;
export const defaultApplicant: Applicant = {
  age: 29,
  partnerStatus: "single",
  education: "bachelor",
  firstLanguage: "english",
  first: [9, 9, 9, 9],
  second: [0, 0, 0, 0],
  canadianYears: 1,
  foreignYears: 0,
  spouseEducation: "none",
  spouseLanguage: [0, 0, 0, 0],
  spouseYears: 0,
  nomination: false,
  sibling: false,
  canadianEducation: 0,
  tradeCertificate: false,
};
