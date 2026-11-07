import { expect, test } from "@playwright/test";

test("direct routes do not reveal records before sign-in", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/#/dashboard", "/#/sales", "/#/costs", "/#/batches", "/#/calendar"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sales and orders" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByTestId("actual-revenue")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
