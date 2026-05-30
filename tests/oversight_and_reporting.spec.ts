import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth-helpers";

test("T42 - View Team Workflow and Bandwidth", async ({ page }) => {
  await loginAsManager(page);
  await page.getByText("i", { exact: true }).nth(1).click();
});

test("T43 - View Overall Active Testing Progress", async ({ page }) => {
  await loginAsManager(page);
  await page.locator("text=Loading controls...").waitFor({ state: "hidden" });
  await expect(page.locator(".dashboard-donut__svg").first()).toBeVisible();
  await page.getByRole("button", { name: "Next week" }).click();
  await page.getByRole("button", { name: "Refresh" }).click();
});
