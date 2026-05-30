import { expect, Page, Locator } from "@playwright/test";
import { todayISO } from "./test-utils";
import { loginAsManager } from "./auth-helpers";

export async function createRequest(
  page: Page,
  {
    name = "Test Requester",
    priority = "LOW",
    purpose = "Test",
    date = todayISO(),
  }: { name?: string; priority?: string; purpose?: string; date?: string } = {},
): Promise<Locator> {
  await loginAsManager(page);
  await page.getByRole("link", { name: "Tracker" }).click();
  const requestsTab = page.getByRole("tab", { name: "Requests" });
  await requestsTab.waitFor({ state: "visible" });
  await requestsTab.click();
  await expect(requestsTab).toHaveAttribute("aria-selected", "true");
  await page.locator("text=Loading requests...").waitFor({ state: "hidden" });
  await expect(
    page.getByRole("button", { name: "+ Add Request" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "+ Add Request" }).click();
  await expect(
    page.getByRole("heading", { name: "Create New Request" }),
  ).toBeVisible();
  await page.getByRole("combobox").selectOption(priority);
  await page.getByPlaceholder("Name").fill(name);
  await page.getByRole("textbox").nth(4).fill(date);
  await page
    .getByPlaceholder("Describe the purpose of this request...")
    .fill(purpose);
  await page.getByRole("button", { name: "Create Request" }).click();
  await page
    .getByRole("heading", { name: "Create New Request" })
    .waitFor({ state: "hidden" });
  await page
    .locator("text=Loading requests...")
    .waitFor({ state: "hidden", timeout: 120000 });

  const firstRequestCard = page.locator(".requests-list .request-card").first();
  await expect(firstRequestCard).toBeVisible({ timeout: 30000 });
  return firstRequestCard;
}
