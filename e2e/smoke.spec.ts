import { expect, test } from "@playwright/test";

test("tracking pages render and record", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/#/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/#/sales");
  await expect(page.getByRole("heading", { name: "Sales and orders" })).toBeVisible();
  await page.getByLabel("Units").first().fill("100");
  await page.getByLabel("Unit price").first().fill("2.20");
  await page.getByRole("button", { name: "Record sale" }).click();
  await expect(page.getByText("100 units").first()).toBeVisible();

  await page.getByLabel("Buyer").fill("Landcare");
  await page.locator("#order-units").fill("500");
  await page.getByRole("button", { name: "Add order" }).click();
  await expect(page.getByText("500 units in enquiries")).toBeVisible();
  await page.locator('select[id^="status-"]').selectOption("confirmed");
  await expect(page.getByText("500 units confirmed")).toBeVisible();
  await page.getByRole("button", { name: "Log as sale" }).click();
  await expect(page.getByText("600 units").first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Paid", exact: true })).toBeVisible();

  await page.goto("/#/costs");
  await expect(page.getByRole("heading", { name: "Costs and labour" })).toBeVisible();
  await page.locator("#expense-amount").fill("220");
  await page.getByRole("button", { name: "Record expense" }).click();
  await expect(page.getByText("$220.00 spent").first()).toBeVisible();
  await page.locator("#week-owner").fill("18");
  await page.getByRole("button", { name: "Log week" }).click();
  await expect(page.getByText("Week starting").first()).toBeVisible();

  await page.goto("/#/batches");
  await expect(page.getByRole("heading", { name: "Production batches" })).toBeVisible();
  await page.locator("#batch-name").fill("Batch A — Golden wattle");
  await page.locator("#batch-started").fill("400");
  await page.locator("#batch-germinated").fill("300");
  await page.locator("#batch-saleable").fill("250");
  await page.locator("#batch-sold").fill("100");
  await page.getByRole("button", { name: "Add batch" }).click();
  await expect(page.getByText("75%").first()).toBeVisible();

  await page.goto("/#/calendar");
  await expect(page.getByText(/of 8 pre-sale checks/)).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await expect(page.getByText(/1 of 8 pre-sale checks/)).toBeVisible();

  await page.goto("/#/dashboard");
  await expect(page.getByTestId("actual-revenue")).toHaveText("$220");
  await expect(page.getByText(/of the 5,882 saleable plants needed/)).toBeVisible();

  expect(errors).toEqual([]);
});
