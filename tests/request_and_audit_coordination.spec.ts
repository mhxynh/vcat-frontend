import { expect, test } from "@playwright/test";
import { createRequest } from "./helpers/request-helpers";
import { todayISO } from "./helpers/test-utils";

async function createUnlinkedControlTest(page) {
  const description = `Request link smoke test ${Date.now()}`;

  await page.getByRole("tab", { name: "Controls" }).click();
  const addControlTestButton = page.getByRole("button", {
    name: "+ Add Control Test",
  });
  await expect(addControlTestButton).toBeEnabled({ timeout: 120000 });
  await addControlTestButton.click();
  await page.getByLabel("VGCPID").waitFor({ state: "visible" });
  await page.getByLabel("VGCPID").selectOption({ index: 1 });
  await page.getByLabel("Test Type").selectOption({ index: 1 });
  await page.getByLabel("Due Date").fill(todayISO());
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create Control Test" }).click();
  await page
    .getByRole("dialog", { name: "Create Control Test" })
    .waitFor({ state: "hidden" });

  return description;
}

test("T24 - Create a Request", async ({ page }) => {
  await createRequest(page);
});

test("T28 - Add Existing Control Test to Request", async ({ page }) => {
  await createRequest(page);
  const controlDescription = await createUnlinkedControlTest(page);
  await page.getByRole("tab", { name: "Requests" }).click();
  await page.locator("text=Loading requests...").waitFor({ state: "hidden" });
  const firstRequestCard = page.locator(".requests-list .request-card").first();
  await firstRequestCard.getByRole("button", { name: "Details" }).click();
  await page.getByRole("button", { name: "Edit Request" }).click();
  await page
    .locator("text=Loading request details...")
    .waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search Controls to add..." })
    .fill(controlDescription);
  const firstResult = page
    .locator(".erm-search-dropdown .erm-search-result-item")
    .first();
  await firstResult.waitFor({ state: "visible" });
  const firstAddBtn = firstResult.locator("button.erm-add-btn");
  await firstAddBtn.scrollIntoViewIfNeeded();
  await firstAddBtn.click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
