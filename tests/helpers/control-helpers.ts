import { expect, Page } from "@playwright/test";

export async function createUniqueControl(
  page: Page,
  description = "Playwright control",
): Promise<string> {
  const vgcpid = `VGCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control" }).click();
  await expect(
    page.getByRole("heading", { name: "Create New Control" }),
  ).toBeVisible();
  await page.getByPlaceholder("e.g. VGCP-123456").fill(vgcpid);
  await page
    .getByPlaceholder("Enter detailed control description...")
    .fill(description);
  await page
    .getByPlaceholder("Last name, first name")
    .first()
    .fill("Test Owner");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Create Control" }).click();
  await page
    .getByRole("heading", { name: "Create New Control" })
    .waitFor({ state: "hidden", timeout: 120000 });

  return vgcpid;
}

export async function openControlById(page: Page, vgcpid: string) {
  await page.getByRole("textbox", { name: "Search controls" }).fill(vgcpid);
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  const header = page
    .locator(".controls-accordion .acc-item button.acc-header")
    .filter({ hasText: vgcpid })
    .first();
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.click();
}
