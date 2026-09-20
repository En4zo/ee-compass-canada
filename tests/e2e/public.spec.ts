import { test, expect } from "@playwright/test";
test("public overview and English preference", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "每一步，都更清晰。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "切换为英文" }).click();
  await expect(
    page.getByRole("heading", { name: "A clearer view of your next step." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Overview", exact: true }),
  ).toBeVisible();
});
test("calculator result is carried into historical comparison", async ({
  page,
}) => {
  await page.goto("/calculator");
  for (let n = 0; n < 3; n++)
    await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("button", { name: "计算分数", exact: true }).click();
  await expect(page.locator(".result-number")).toContainText("432");
  await page.getByRole("button", { name: "加入历史趋势比较" }).click();
  await expect(page.locator(".chart-note")).toContainText("你的参考分数: 432");
  await page.getByRole("button", { name: "移除", exact: true }).click();
  await expect(
    page.getByText("完成 CRS 自评，将你的分数加入图表进行比较。", {
      exact: true,
    }),
  ).toBeVisible();
});
test("history filtering and empty state", async ({ page }) => {
  await page.goto("/draws");
  await page
    .getByRole("combobox", { name: "抽选类别" })
    .selectOption("Provincial Nominee Program");
  await expect(page.locator("tbody .round-tag").first()).toHaveText("PNP");
  await page.getByLabel("从", { exact: true }).fill("2099-01-01");
  await expect(
    page.getByText("没有匹配的抽选记录", { exact: true }),
  ).toBeVisible();
});
test("preview prevents pretend writes", async ({ page }) => {
  await page.goto("/forum/new");
  await expect(
    page.getByRole("heading", { name: "连接社区，只差一步" }),
  ).toBeVisible();
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "账户功能尚未连接" }),
  ).toBeVisible();
});
test("small viewports do not overflow", async ({ page }) => {
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/calculator");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
