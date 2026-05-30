import { test, expect } from "@playwright/test";
import { loginAsManager, loginAsTester } from "./helpers/auth-helpers";
import { createUniqueControl } from "./helpers/control-helpers";
import { todayISO } from "./helpers/test-utils";

async function createNotStartedTestForCurrentTester(
  page,
  description = "Lifecycle smoke test",
) {
  await loginAsManager(page);
  const vgcpid = await createUniqueControl(page, description);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control Test" }).click();
  const vgcpidSelect = page.getByLabel("VGCPID");
  await expect(vgcpidSelect).toBeEnabled({ timeout: 120000 });
  await vgcpidSelect.selectOption(vgcpid);

  const testerSelect = page.getByLabel("Tester");
  await expect(testerSelect).toBeEnabled({ timeout: 120000 });
  const testerOption = testerSelect
    .locator("option")
    .filter({ hasText: /monique/i })
    .first();
  const testerValue = await testerOption.getAttribute("value");
  if (testerValue) {
    await testerSelect.selectOption(testerValue);
  } else {
    await testerSelect.selectOption({ index: 1 });
  }

  const testTypeSelect = page.getByLabel("Test Type");
  await expect(testTypeSelect).toBeEnabled();
  await testTypeSelect.selectOption({ index: 1 });
  await page.getByLabel("Due Date").fill(todayISO());
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create Control Test" }).click();
  await page
    .getByRole("dialog", { name: "Create Control Test" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sign out" }).click();
  await page
    .getByRole("textbox", { name: "Email Address" })
    .waitFor({ state: "visible" });
}

async function openFirstVisibleControlTest(page) {
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .waitFor({ state: "visible" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .locator("button.vgcpid-link")
    .click();
}

async function filterControlsByStatusAndDescription(page, status, description) {
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search controls" })
    .fill(description);
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByLabel("Status").selectOption(status);
  await page.getByRole("button", { name: "Apply" }).click();
  await openFirstVisibleControlTest(page);
}

test("T14 - Create New Tests", async ({ page }) => {
  const description = `Lifecycle create test ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await loginAsManager(page);
  const vgcpid = await createUniqueControl(page, description);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control Test" }).click();
  await expect(page.locator("text=Loading...")).toHaveCount(0);
  await expect(page.getByLabel("VGCPID")).toBeEnabled({ timeout: 120000 });
  await page.getByLabel("VGCPID").selectOption(vgcpid);
  await page.getByLabel("Link to Request").waitFor({ state: "visible" });
  await page.getByLabel("Link to Request").selectOption({ index: 1 });
  await expect(page.getByLabel("Tester")).toBeEnabled({ timeout: 120000 });
  await page.getByLabel("Tester").selectOption({ index: 1 });
  await expect(page.getByLabel("Test Type")).toBeEnabled();
  await page.getByLabel("Test Type").selectOption({ index: 1 });
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create Control Test" }).click();
  await page
    .getByRole("dialog", { name: "Create Control Test" })
    .waitFor({ state: "hidden", timeout: 120000 });
  await page
    .getByRole("textbox", { name: "Search controls" })
    .fill(description);
  await expect(page.locator("table.table--tests tbody tr")).toHaveCount(1, {
    timeout: 30000,
  });
});

test("T18 - Start Work on a Not Started Test", async ({ page }) => {
  const description = `Lifecycle start work ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await createNotStartedTestForCurrentTester(page, description);
  await loginAsTester(page);
  await filterControlsByStatusAndDescription(page, "NOT_STARTED", description);
  await page.getByRole("button", { name: "Start Work" }).click();
  await page
    .locator("text=Testing Ready")
    .first()
    .waitFor({ state: "visible" });
});

test("T19 - Advance Test Workflow to Next Step", async ({ page }) => {
  const description = `Lifecycle next step ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await createNotStartedTestForCurrentTester(page, description);
  await loginAsTester(page);
  await filterControlsByStatusAndDescription(page, "NOT_STARTED", description);
  await page.getByRole("button", { name: "Start Work" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page
    .locator("text=Walkthrough Scheduled")
    .first()
    .waitFor({ state: "visible" });
});

test("T34 - Approve In-Review Test", async ({ page }) => {
  const description = `Lifecycle review approval ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;

  await createNotStartedTestForCurrentTester(page, description);
  await loginAsManager(page);
  await filterControlsByStatusAndDescription(page, "NOT_STARTED", description);
  await page.getByRole("button", { name: "Start Work" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: "Submit for Approval" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.locator("text=In Review").first().waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Approve Control" }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
});

test("T36 - Add Links to Test", async ({ page }) => {
  const description = `Lifecycle attachment link ${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;
  await createNotStartedTestForCurrentTester(page, description);
  await loginAsTester(page);
  await filterControlsByStatusAndDescription(page, "NOT_STARTED", description);
  await page.getByRole("button", { name: "Attachments" }).click();
  await page.getByRole("button", { name: "Add Link" }).click();
  await page
    .getByRole("textbox", { name: "Link URL" })
    .fill("https://google.com");
  await page
    .getByLabel("Add Attachment Link")
    .getByRole("button", { name: "Add Link" })
    .click();
});
