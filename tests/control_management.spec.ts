import { test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth-helpers";

test("T1 - View Controls Catalog", async ({ page }) => {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Active", exact: true }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Retired" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "All" }).click();
  await page
    .locator(".controls-accordion .acc-item button.acc-header")
    .first()
    .click();
});

test("T3 - Create a New Control", async ({ page }) => {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control" }).click();
  const randomVgcp = `VGCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await page.getByRole("textbox", { name: "e.g. VGCP-" }).click();
  await page.getByRole("textbox", { name: "e.g. VGCP-" }).fill(randomVgcp);
  await page.getByRole("textbox", { name: "Enter detailed control" }).click();
  await page
    .getByRole("textbox", { name: "Enter detailed control" })
    .fill("Test example");
  await page.getByRole("textbox", { name: "Name" }).first().click();
  await page.getByRole("textbox", { name: "Name" }).first().fill("Test Owner");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Create Control" }).click();
});

test("T4 - Update Control Details", async ({ page }) => {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page
    .locator(".controls-accordion .acc-item button.acc-header")
    .first()
    .click();
  await page.getByRole("button", { name: "View More Details" }).click();
  await page.getByRole("button", { name: "Edit Control" }).click();
  await page.getByRole("textbox", { name: "Enter detailed control" }).click();
  await page
    .getByRole("textbox", { name: "Enter detailed control" })
    .fill("Test example updated");
  await page.getByRole("textbox").nth(3).click();
  await page.getByRole("textbox").nth(3).fill("Test Owner updated");
  await page.getByRole("textbox").nth(4).click();
  await page.getByRole("textbox").nth(4).fill("SME updated");
  await page.locator("label").filter({ hasText: "Yes" }).click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
