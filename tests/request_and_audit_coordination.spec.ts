import { test } from "@playwright/test";
import { createRequest } from "./helpers/request-helpers";

test("T24 - Create a Request", async ({ page }) => {
  await createRequest(page);
});

test("T28 - Add Existing Control Test to Request", async ({ page }) => {
  const firstRequestCard = await createRequest(page);
  await firstRequestCard.getByRole("button", { name: "Details" }).click();
  await page.getByRole("button", { name: "Edit Request" }).click();
  await page
    .locator("text=Loading request details...")
    .waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search Controls to add..." })
    .click();
  const firstResult = page
    .locator(".erm-search-dropdown .erm-search-result-item")
    .first();
  await firstResult.waitFor({ state: "visible" });
  const firstAddBtn = firstResult.locator("button.erm-add-btn");
  await firstAddBtn.scrollIntoViewIfNeeded();
  await firstAddBtn.click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
