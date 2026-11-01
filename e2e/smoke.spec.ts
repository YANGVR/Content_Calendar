import { expect, test } from "@playwright/test";

test("로그인하지 않으면 메인 화면 대신 로그인 화면이 열린다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle("Content Calendar");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("로그인");
});
