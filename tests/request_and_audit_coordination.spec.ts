import { expect, test } from "@playwright/test";
import { createRequest } from "./helpers/request-helpers";

test("T24 - Create a Request", async ({ page }) => {
  await createRequest(page);
});

test("T28 - Add Existing Control Test to Request", async ({
  page,
}, testInfo) => {
  const requesterName = `T28 Requester ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await createRequest(page, { name: requesterName });
  await page.getByRole("tab", { name: "Requests" }).click();
  await page.locator("text=Loading requests...").waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search requests" })
    .fill(requesterName);
  const createdRequestCard = page
    .locator(".requests-list .request-card")
    .first();
  await expect(createdRequestCard).toBeVisible({ timeout: 30000 });
  const detailsButton = page.getByRole("button", { name: "Details" }).first();
  await expect(detailsButton).toBeEnabled({ timeout: 30000 });
  await detailsButton.click();
  const requestDetailsDialog = page.getByRole("dialog").filter({
    hasText: "Request Details:",
  });
  await expect(requestDetailsDialog).toBeVisible({ timeout: 30000 });
  await requestDetailsDialog
    .getByRole("button", { name: "Edit Request" })
    .click();
  const editRequestDialog = page.getByRole("dialog", { name: "Edit Request" });
  await expect(editRequestDialog).toBeVisible({ timeout: 30000 });
  await page
    .locator("text=Loading request details...")
    .waitFor({ state: "hidden" });
  await editRequestDialog
    .getByRole("textbox", { name: "Search Controls to add..." })
    .fill("VGCP");
  const projectResultOffset =
    {
      chromium: 0,
      firefox: 1,
      webkit: 2,
    }[testInfo.project.name] ?? 0;
  const firstResult = page
    .locator(".erm-search-dropdown .erm-search-result-item")
    .nth(projectResultOffset);
  await firstResult.waitFor({ state: "visible" });
  const firstAddBtn = firstResult.locator("button.erm-add-btn");
  await firstAddBtn.scrollIntoViewIfNeeded();
  await firstAddBtn.click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
