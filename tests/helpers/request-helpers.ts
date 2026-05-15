import { Page, Locator } from "@playwright/test";
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
  await page.getByRole("button", { name: "Requests" }).click();
  await page.locator("text=Loading requests...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Request" }).click();
  await page.getByRole("combobox").selectOption(priority);
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("textbox").nth(4).fill(date);
  await page
    .getByRole("textbox", { name: "Describe the purpose of this" })
    .click();
  await page
    .getByRole("textbox", { name: "Describe the purpose of this" })
    .fill(purpose);
  await page.getByRole("button", { name: "Create Request" }).click();

  const firstRequestCard = page.locator(".requests-list .request-card").first();
  await firstRequestCard.waitFor({ state: "visible" });
  return firstRequestCard;
}
