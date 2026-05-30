import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth-helpers";
import {
  createUniqueControl,
  openControlById,
} from "./helpers/control-helpers";

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
  const vgcpid = await createUniqueControl(page);
  await openControlById(page, vgcpid);
});

test("T4 - Update Control Details", async ({ page }) => {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  const vgcpid = await createUniqueControl(page, "Control edit smoke test");
  await openControlById(page, vgcpid);
  await page.getByRole("button", { name: "View More Details" }).click();
  await page.getByRole("button", { name: "Edit Control" }).click();
  await page
    .getByPlaceholder("Enter detailed control description...")
    .fill("Test example updated");
  await page.getByRole("textbox").nth(3).fill("Test Owner updated");
  await page.getByRole("textbox").nth(4).fill("SME updated");
  await page.locator("label").filter({ hasText: "Yes" }).click();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page
    .getByRole("heading", { name: `Edit Control: ${vgcpid}` })
    .waitFor({ state: "hidden", timeout: 120000 });
});
