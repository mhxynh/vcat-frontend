import { test, expect } from "@playwright/test";
import { loginAsManager, loginAsTester } from "./helpers/auth-helpers";

test("T14 - Create New Tests", async ({ page }) => {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control Test" }).click();
  await expect(page.locator("text=Loading...")).toHaveCount(0);
  await page.getByLabel("VGCPID*").waitFor({ state: "visible" });
  await page.getByLabel("VGCPID*").selectOption({ index: 1 });
  await page.getByLabel("Link to Request").waitFor({ state: "visible" });
  await page.getByLabel("Link to Request").selectOption({ index: 1 });
  await page.getByLabel("Tester").waitFor({ state: "visible" });
  await page.getByLabel("Tester").selectOption({ index: 1 });
  await page.getByLabel("Test Type*").waitFor({ state: "visible" });
  await page.getByLabel("Test Type*").selectOption({ index: 1 });
  await page.getByRole("textbox", { name: "Description*" }).click();
  await page.getByRole("textbox", { name: "Description*" }).fill("Test");
  await page.getByRole("button", { name: "Create Control Test" }).click();
});

test("T18 - Start Work on a Not Started Test", async ({ page }) => {
  await loginAsTester(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByLabel("Status").selectOption("NOT_STARTED");
  await page.getByRole("button", { name: "Apply" }).click();
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .waitFor({ state: "visible" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .locator("button.vgcpid-link")
    .click();
  await page.getByRole("button", { name: "Start Work" }).click();
  await page
    .locator("text=Testing Ready")
    .first()
    .waitFor({ state: "visible" });
});

test("T19 - Advance Test Workflow to Next Step", async ({ page }) => {
  await loginAsTester(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByLabel("Status").selectOption("NOT_STARTED");
  await page.getByRole("button", { name: "Apply" }).click();
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .waitFor({ state: "visible" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .locator("button.vgcpid-link")
    .click();
  await page.getByRole("button", { name: "Start Work" }).click();
  await page.getByRole("button", { name: "Next Step" }).click();
  await page
    .locator("text=Walkthrough Scheduled")
    .first()
    .waitFor({ state: "visible" });
});

test("T34 - Approve In-Review Test", async ({ page }) => {
  await loginAsTester(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByLabel("Status").selectOption("IN_REVIEW");
  await page.getByRole("button", { name: "Apply" }).click();
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .waitFor({ state: "visible" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .locator("button.vgcpid-link")
    .click();
  await page.getByRole("button", { name: "Approve Control" }).click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
});

test("T36 - Add Links to Test", async ({ page }) => {
  await loginAsTester(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  await page.locator("text=Loading tests...").waitFor({ state: "hidden" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .waitFor({ state: "visible" });
  await page
    .locator("table.table--tests tbody tr")
    .first()
    .locator("button.vgcpid-link")
    .click();
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
