import { expect, test } from "@playwright/test";
import { createUniqueControl } from "./helpers/control-helpers";
import { createRequest } from "./helpers/request-helpers";
import { todayISO } from "./helpers/test-utils";

async function createUnlinkedControlTest(
  page,
  vgcpid: string,
  description: string,
) {
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control Test" }).click();

  const vgcpidSelect = page.getByLabel("VGCPID");
  await expect(vgcpidSelect).toBeEnabled({ timeout: 120000 });
  await vgcpidSelect.selectOption(vgcpid);

  const testerSelect = page.getByLabel("Tester");
  await expect(testerSelect).toBeEnabled({ timeout: 120000 });
  await testerSelect.selectOption({ index: 1 });

  const testTypeSelect = page.getByLabel("Test Type");
  await expect(testTypeSelect).toBeEnabled();
  await testTypeSelect.selectOption({ index: 1 });

  await page.getByLabel("Due Date").fill(todayISO());
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create Control Test" }).click();
  await page
    .getByRole("dialog", { name: "Create Control Test" })
    .waitFor({ state: "hidden", timeout: 120000 });
}

test("T24 - Create a Request", async ({ page }) => {
  await createRequest(page);
});

test("T28 - Add Existing Control Test to Request", async ({ page }) => {
  const requesterName = `T28 Requester ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await createRequest(page, { name: requesterName });
  const testDescription = `T28 control test ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  const vgcpid = await createUniqueControl(page, testDescription);
  await createUnlinkedControlTest(page, vgcpid, testDescription);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.getByRole("button", { name: "Requests" }).click();
  await page.locator("text=Loading requests...").waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search requests" })
    .fill(requesterName);
  const createdRequestCard = page
    .locator(".requests-list .request-card")
    .filter({ hasText: requesterName })
    .first();
  await expect(createdRequestCard).toBeVisible({ timeout: 30000 });
  const detailsButton = createdRequestCard.getByRole("button", {
    name: "Details",
  });
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
    .fill(vgcpid);
  const firstResult = editRequestDialog
    .locator(".erm-search-dropdown .erm-search-result-item")
    .filter({ hasText: vgcpid })
    .first();
  await firstResult.waitFor({ state: "visible" });
  const firstAddBtn = firstResult.locator("button.erm-add-btn");
  await firstAddBtn.scrollIntoViewIfNeeded();
  await firstAddBtn.click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
