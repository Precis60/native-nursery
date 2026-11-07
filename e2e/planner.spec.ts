import { expect, test } from "@playwright/test";

test("dashboard fits a narrow phone", async ({ page }) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Native Nursery" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `planner is wider than ${width}px`).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "Species" }).click();
    await expect(page.getByRole("heading", { name: "Twenty species" })).toBeVisible();
    const speciesOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(speciesOverflow, `species is wider than ${width}px`).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "Shopping" }).click();
    await expect(page.getByRole("heading", { name: "Shopping reference" })).toBeVisible();
    const shoppingOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(shoppingOverflow, `shopping is wider than ${width}px`).toBeLessThanOrEqual(1);
    for (const [label, heading] of [
      ["Calendar", "Calendar and checks"],
      ["Compare", "Compare"],
      ["Scenarios", "Scenarios"],
      ["Account", "Account"],
    ] as const) {
      await page.getByRole("link", { name: label }).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(pageOverflow, `${label} is wider than ${width}px`).toBeLessThanOrEqual(1);
    }
    await page.getByRole("link", { name: "Planner", exact: true }).click();
  }
  await page.screenshot({ path: "test-results/screenshots/dashboard-390.png" });
});

test("planner edits, impossible break-even, and a browser save", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Native Nursery" })).toBeVisible();
  await expect(page.getByText("Account save is pending owner setup").first()).toBeVisible();
  await expect(page.getByTestId("storage-label")).toContainText("this browser");
  await expect(page.getByLabel("Business rent per week")).toHaveValue("0");

  const revenue = page.getByTestId("revenue");
  const before = await revenue.innerText();
  await expect(revenue).not.toHaveText("—");
  await page.getByLabel("Sales target").fill("3500");
  await expect(revenue).not.toHaveText(before);
  await page.evaluate(() => window.scrollTo(0, 0));

  if (info.project.name === "desktop") {
    await page.screenshot({ path: "test-results/screenshots/planner-desktop.png", fullPage: true });
  } else {
    await page.screenshot({ path: "test-results/screenshots/planner-mobile.png" });
  }

  await page.getByLabel("Sell-through").fill("0");
  await expect(page.getByTestId("break-even")).toContainText("No finite production");
  if (info.project.name === "desktop") {
    await page.screenshot({ path: "test-results/screenshots/break-even-impossible.png", fullPage: false });
  }

  await page.getByRole("button", { name: "Save in this browser" }).click();
  await page.getByRole("link", { name: "Scenarios" }).click();
  await expect(page.getByRole("heading", { name: "Scenarios" })).toBeVisible();
  await expect(page.getByText("This browser").first()).toBeVisible();
  await expect(page.getByText("Year 1 full scale").first()).toBeVisible();

  await page.getByRole("link", { name: "Species" }).click();
  await expect(page.getByRole("heading", { name: "Twenty species" })).toBeVisible();
  const speciesOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(speciesOverflow, "species page is wider than the viewport").toBeLessThanOrEqual(1);
  if (info.project.name === "desktop") {
    await page.screenshot({ path: "test-results/screenshots/species-desktop.png", fullPage: false });
  }

  await page.getByRole("link", { name: "Shopping" }).click();
  await expect(page.getByRole("heading", { name: "Shopping reference" })).toBeVisible();
  await expect(page.getByText("Still quote-needed")).toBeVisible();
  await expect(page.getByText("rough reference").first()).toBeVisible();
  const shoppingOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(shoppingOverflow, "shopping page is wider than the viewport").toBeLessThanOrEqual(1);
  if (info.project.name === "mobile") {
    await page.screenshot({ path: "test-results/screenshots/shopping-mobile.png", fullPage: false });
  }
});
