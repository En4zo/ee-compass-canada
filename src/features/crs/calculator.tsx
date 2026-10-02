"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { PageHeading } from "@/components/ui";
import { educationLabels } from "@/messages/navigation";
import { EDUCATION, RULE_SOURCE, RULE_VERSION } from "./rules";
import { applicantSchema, defaultApplicant, type Applicant } from "./schema";
import { calculateCRS, type CRSResult } from "./calculate";
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Calculator() {
  const { t, language } = useI18n(),
    router = useRouter();
  const [a, setA] = useState<Applicant>({ ...defaultApplicant }),
    [step, setStep] = useState(0),
    [result, setResult] = useState<CRSResult | null>(null),
    [error, setError] = useState("");
  const steps = [
    t("基本背景", "Your background"),
    t("语言能力", "Language skills"),
    t("工作与配偶", "Work & partner"),
    t("附加因素", "Additional factors"),
  ];
  const set = <K extends keyof Applicant>(key: K, value: Applicant[K]) => {
    setA((old) => ({ ...old, [key]: value }));
    setResult(null);
    setError("");
  };
  const educationSelect = (key: "education" | "spouseEducation") => (
    <select
      value={a[key]}
      onChange={(e) => set(key, e.target.value as Applicant[typeof key])}
    >
      {EDUCATION.map((v, i) => (
        <option value={v} key={v}>
          {educationLabels[language][i]}
        </option>
      ))}
    </select>
  );
  const years = (
    key: "canadianYears" | "foreignYears" | "spouseYears",
    max: number,
  ) => (
    <select value={a[key]} onChange={(e) => set(key, Number(e.target.value))}>
      {Array.from({ length: max + 1 }, (_, n) => (
        <option key={n} value={n}>
          {n === 0
            ? t("无 / 不满一年", "None / less than a year")
            : `${n}${n === max ? "+" : ""} ${t("年", "year(s)")}`}
        </option>
      ))}
    </select>
  );
  const languageInputs = (key: "first" | "second" | "spouseLanguage") => (
    <div className="language-grid">
      {[
        t("听力", "Listening"),
        t("口语", "Speaking"),
        t("阅读", "Reading"),
        t("写作", "Writing"),
      ].map((label, i) => (
        <Field key={label} label={label}>
          <select
            aria-label={`${key} ${label}`}
            value={a[key][i]}
            onChange={(e) => {
              const levels = [...a[key]] as Applicant[typeof key];
              levels[i] = Number(e.target.value);
              set(key, levels);
            }}
          >
            {Array.from({ length: 13 }, (_, n) => (
              <option key={n} value={n}>
                {n === 0 ? t("未考试", "Not tested") : n}
              </option>
            ))}
          </select>
        </Field>
      ))}
    </div>
  );
  function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicantSchema.safeParse(a).success) {
      setError(t("请检查填写的数值范围。", "Please check the input ranges."));
      return;
    }
    if (step < 3) setStep(step + 1);
    else setResult(calculateCRS(a));
  }
  return (
    <>
      <PageHeading
        eyebrow="KNOW YOUR SCORE"
        title={["CRS 自助评分", "Your CRS, explained"]}
        description={[
          "从你的背景出发，逐项了解分数。无需注册，输入不会发送或保存到服务器。",
          "Understand each part of your score. No account needed; your answers stay in memory.",
        ]}
      />
      <div className="calculator-layout">
        <div>
          <div
            className="stepper"
            aria-label={t("评分步骤", "Assessment steps")}
          >
            {steps.map((s, i) => (
              <button
                key={s}
                className={step === i ? "current" : step > i ? "complete" : ""}
                onClick={() => {
                  setStep(i);
                  setResult(null);
                }}
              >
                <span>
                  {step > i ? (
                    <Check size={16} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{s}</strong>
              </button>
            ))}
          </div>
          <form className="panel calculator-form" onSubmit={next}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">STEP {step + 1} OF 4</span>
                <h2>{steps[step]}</h2>
              </div>
              <span className="muted">
                {Math.round(((step + 1) / 4) * 100)}%
              </span>
            </div>
            {step === 0 && (
              <div className="form-stack">
                <p className="form-hint">
                  {t(
                    "预填值仅用于展示，请替换为你自己的实际情况。CRS 算分不等于项目资格评估。",
                    "Values are prefilled as an example. Replace them with your own information. A CRS score does not establish program eligibility.",
                  )}
                </p>
                <Field
                  label={t("年龄", "Age")}
                  hint={t(
                    "按目前的周岁填写。",
                    "Use your current age in completed years.",
                  )}
                >
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={Number.isNaN(a.age) ? "" : a.age}
                    onChange={(e) => set("age", e.target.valueAsNumber)}
                  />
                </Field>
                <Field label={t("婚姻与配偶状态", "Spouse / partner status")}>
                  <select
                    value={a.partnerStatus}
                    onChange={(e) =>
                      set(
                        "partnerStatus",
                        e.target.value as Applicant["partnerStatus"],
                      )
                    }
                  >
                    <option value="single">
                      {t("无配偶 / 同居伴侣", "No spouse / common-law partner")}
                    </option>
                    <option value="accompanying">
                      {t(
                        "配偶随行，且非加拿大公民或永久居民",
                        "Accompanying spouse, not a Canadian citizen or PR",
                      )}
                    </option>
                    <option value="notAccompanying">
                      {t("配偶不随行", "Spouse is not accompanying")}
                    </option>
                    <option value="citizen">
                      {t(
                        "配偶为加拿大公民或永久居民",
                        "Spouse is a Canadian citizen or permanent resident",
                      )}
                    </option>
                  </select>
                </Field>
                <Field
                  label={t("最高可计分学历", "Highest eligible education")}
                  hint={t(
                    "海外学历须具备有效 ECA；多个学历和专业学位须满足 IRCC 条件。",
                    "Foreign credentials require a valid ECA. Multiple credentials and professional degrees must meet IRCC criteria.",
                  )}
                >
                  {educationSelect("education")}
                </Field>
              </div>
            )}
            {step === 1 && (
              <div className="form-stack">
                <p className="form-hint">
                  {t(
                    "请输入有效语言考试对应的 CLB / NCLC 等级，不是雅思等考试原始分数。",
                    "Enter CLB / NCLC levels from valid language tests, not raw IELTS or other test scores.",
                  )}{" "}
                  <a
                    className="text-link"
                    href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("官方成绩换算", "Official conversion tables")} ↗
                  </a>
                </p>
                <Field label={t("第一官方语言", "First official language")}>
                  <select
                    value={a.firstLanguage}
                    onChange={(e) =>
                      set(
                        "firstLanguage",
                        e.target.value as "english" | "french",
                      )
                    }
                  >
                    <option value="english">
                      {t("英语 (CLB)", "English (CLB)")}
                    </option>
                    <option value="french">
                      {t("法语 (NCLC)", "French (NCLC)")}
                    </option>
                  </select>
                </Field>
                <h3>{t("第一语言四项等级", "First language levels")}</h3>
                {languageInputs("first")}
                <h3>
                  {a.firstLanguage === "english"
                    ? t(
                        "第二语言：法语 (NCLC)",
                        "Second language: French (NCLC)",
                      )
                    : t(
                        "第二语言：英语 (CLB)",
                        "Second language: English (CLB)",
                      )}
                </h3>
                {languageInputs("second")}
              </div>
            )}
            {step === 2 && (
              <div className="form-stack">
                <Field
                  label={t(
                    "加拿大可计分工作经验",
                    "Eligible Canadian work experience",
                  )}
                  hint={t(
                    "按完整年计算；工作地点、职业类别、授权和学生期间经验须符合 IRCC 要求。",
                    "Count complete years that satisfy IRCC location, occupation, authorization and student-work rules.",
                  )}
                >
                  {years("canadianYears", 5)}
                </Field>
                <Field
                  label={t(
                    "海外可计分工作经验",
                    "Eligible foreign work experience",
                  )}
                >
                  {years("foreignYears", 3)}
                </Field>
                {a.partnerStatus === "accompanying" ? (
                  <>
                    <div className="divider" />
                    <h3>{t("随行配偶因素", "Accompanying partner factors")}</h3>
                    <Field label={t("配偶学历", "Partner’s education")}>
                      {educationSelect("spouseEducation")}
                    </Field>
                    <h3>
                      {t(
                        "配偶语言 CLB / NCLC",
                        "Partner’s language CLB / NCLC",
                      )}
                    </h3>
                    {languageInputs("spouseLanguage")}
                    <Field
                      label={t(
                        "配偶加拿大工作经验",
                        "Partner’s Canadian work experience",
                      )}
                    >
                      {years("spouseYears", 5)}
                    </Field>
                  </>
                ) : (
                  <div className="info-box">
                    {t(
                      "当前配偶状态按无随行配偶标准计分。",
                      "Your selected partner status uses the without-spouse scoring table.",
                    )}
                  </div>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="form-stack">
                <Field
                  label={t(
                    "符合条件的加拿大高等教育",
                    "Eligible Canadian post-secondary education",
                  )}
                  hint={t(
                    "须满足 IRCC 对课程、学习时间与学习方式的要求；专业学位、硕士或博士选择 30 分档。",
                    "Must meet IRCC program, duration and study-mode conditions. Eligible professional, master’s and doctoral degrees use the 30-point tier.",
                  )}
                >
                  <select
                    value={a.canadianEducation}
                    onChange={(e) =>
                      set(
                        "canadianEducation",
                        Number(e.target.value) as 0 | 15 | 30,
                      )
                    }
                  >
                    <option value={0}>
                      {t("不符合 / 无", "Not eligible / none")}
                    </option>
                    <option value={15}>
                      {t("一年或两年制：15 分", "One or two years: 15 points")}
                    </option>
                    <option value={30}>
                      {t(
                        "三年及以上 / 符合条件的研究生学历：30 分",
                        "Three or more years / eligible graduate degree: 30 points",
                      )}
                    </option>
                  </select>
                </Field>
                {(
                  [
                    [
                      "nomination",
                      t(
                        "已获得并接受与 Express Entry 关联的省提名",
                        "Accepted an Express Entry provincial nomination",
                      ),
                    ],
                    [
                      "sibling",
                      t(
                        "本人或随行配偶有居住在加拿大、年满 18 岁且为公民或永久居民的兄弟姐妹",
                        "You or your accompanying partner have an eligible sibling in Canada, age 18+, citizen or PR",
                      ),
                    ],
                    [
                      "tradeCertificate",
                      t(
                        "持有加拿大主管机构签发的技工资格证书（非一般职业培训证书）",
                        "Hold a Canadian certificate of qualification in a trade (not a general training certificate)",
                      ),
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <label className="checkbox-card" key={key}>
                    <input
                      type="checkbox"
                      checked={a[key]}
                      onChange={(e) => set(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
                <div className="info-box">
                  {t(
                    "法语附加分根据已填写的语言等级自动计算。Job offer 不再提供额外 CRS 分数。",
                    "French-language bonus points are calculated from your language levels. Job offers no longer add CRS points.",
                  )}
                </div>
              </div>
            )}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={16} />
                {t("上一步", "Back")}
              </button>
              <button className="button" type="submit">
                {step === 3
                  ? t("计算分数", "Calculate score")
                  : t("下一步", "Continue")}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
        <aside className="result-column">
          <section className="panel result-card" aria-live="polite">
            <span className="eyebrow">YOUR CRS BREAKDOWN</span>
            <h2>{t("你的评分结果", "Your score breakdown")}</h2>
            <div className="result-number">
              {result ? result.total : "—"}
              <span>/ 1,200</span>
            </div>
            {[
              [t("核心人力资本", "Core / human capital"), result?.core, 500],
              [t("配偶因素", "Partner factors"), result?.partner, 40],
              [
                t("技能转移能力", "Skill transferability"),
                result?.transfer,
                100,
              ],
              [t("附加分", "Additional points"), result?.additional, 600],
            ].map(([label, value, max]) => (
              <div className="breakdown-row" key={String(label)}>
                <div>
                  <span>{label}</span>
                  <strong>{value ?? "—"}</strong>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${(Number(value ?? 0) / Number(max)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {result ? (
              <>
                <button
                  className="button full-width"
                  onClick={() => {
                    sessionStorage.setItem("compass-crs", String(result.total));
                    router.push("/draws");
                  }}
                >
                  {t("加入历史趋势比较", "Compare with draw history")}
                  <ArrowRight size={16} />
                </button>
                <details className="details">
                  <summary>
                    {t(
                      "查看详细分项（应用封顶前）",
                      "Detailed factors (before group caps)",
                    )}
                  </summary>
                  {Object.entries(result.details).map(([key, value]) => (
                    <div className="detail-row" key={key}>
                      <span>{detailLabel(key, language)}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </details>
              </>
            ) : (
              <p className="muted">
                {t(
                  "完成四个步骤后，即可看到分项与总分。",
                  "Complete all four steps to see your total and breakdown.",
                )}
              </p>
            )}
          </section>
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <div>
              <strong>
                {t(
                  "你的背景，只留在当前页面",
                  "Your answers stay on this page",
                )}
              </strong>
              <p>
                {t(
                  "只有点击比较时才临时保留总分。关闭标签页后清除。",
                  "Only the total is kept for comparison, until this tab closes.",
                )}
              </p>
            </div>
          </div>
          <a
            href={RULE_SOURCE}
            className="text-link"
            target="_blank"
            rel="noreferrer"
          >
            {t("IRCC 评分规则", "IRCC scoring criteria")}
            <ExternalLink size={14} />
          </a>
          <small className="rule-version">{RULE_VERSION}</small>
          <button
            className="text-link reset-button"
            onClick={() => {
              setA({ ...defaultApplicant });
              setStep(0);
              setResult(null);
              setError("");
              sessionStorage.removeItem("compass-crs");
            }}
          >
            <RotateCcw size={14} />
            {t("重置为示例值", "Reset to example values")}
          </button>
        </aside>
      </div>
    </>
  );
}
function detailLabel(key: string, language: "zh" | "en") {
  const labels: Record<string, [string, string]> = {
    age: ["年龄", "Age"],
    education: ["学历", "Education"],
    firstLanguage: ["第一语言", "First language"],
    secondLanguage: ["第二语言", "Second language"],
    work: ["加拿大经验", "Canadian experience"],
    partnerEducation: ["配偶学历", "Partner education"],
    partnerLanguage: ["配偶语言", "Partner language"],
    partnerWork: ["配偶工作经验", "Partner experience"],
    educationTransfer: ["学历组合", "Education combinations"],
    foreignTransfer: ["海外经验组合", "Foreign experience combinations"],
    certificateTransfer: ["技工资格组合", "Trade certificate combination"],
    frenchBonus: ["法语加分", "French bonus"],
    nomination: ["省提名", "Nomination"],
    sibling: ["兄弟姐妹", "Sibling"],
    canadianEducation: ["加拿大教育", "Canadian education"],
  };
  return labels[key]?.[language === "zh" ? 0 : 1] ?? key;
}
