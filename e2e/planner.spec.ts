import { expect, test } from "@playwright/test";

test("signed-out routes show only the gate", async ({ page }) => {
  for (const path of ["/", "/#/species", "/#/shopping", "/#/sales", "/#/account"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Native Nursery" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Twenty species" })).toHaveCount(0);
    await expect(page.getByTestId("revenue")).toHaveCount(0);
    await expect(page.getByTestId("forecast")).toHaveCount(0);
  }
});

test("the sign-in gate fits a narrow phone", async ({ page }) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/#/dashboard");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `gate is wider than ${width}px`).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: "test-results/screenshots/sign-in-gate.png" });
});
