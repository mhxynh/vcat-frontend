import { test } from "@playwright/test";

test("T1 - View Controls Catalog", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page
    .getByRole("textbox", { name: "Email Address" })
    .fill("moniqueh@vanguard.com");
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill("Vcat2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Retired" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "All" }).click();
  await page.locator("text=VGCP").first().click();
});

test("T3 - Create a New Control", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page
    .getByRole("textbox", { name: "Email Address" })
    .fill("moniqueh@vanguard.com");
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill("Vcat2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "+ Add Control" }).click();
  const randomVgcp = `VGCP-${Math.floor(10000 + Math.random() * 90000)}`;
  await page.getByRole("textbox", { name: "e.g. VGCP-" }).click();
  await page.getByRole("textbox", { name: "e.g. VGCP-" }).fill(randomVgcp);
  await page.getByRole("textbox", { name: "Enter detailed control" }).click();
  await page
    .getByRole("textbox", { name: "Enter detailed control" })
    .fill("Test example");
  await page.getByRole("textbox", { name: "Name" }).first().click();
  await page.getByRole("textbox", { name: "Name" }).first().fill("Test Owner");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Create Control" }).click();
});

test("T4 - Update Control Details", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page
    .getByRole("textbox", { name: "Email Address" })
    .fill("moniqueh@vanguard.com");
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill("Vcat2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Catalog" }).click();
  await page.locator("text=Loading Controls...").waitFor({ state: "hidden" });
  await page
    .locator(".controls-accordion .acc-item button.acc-header")
    .first()
    .click();
  await page.getByRole("button", { name: "View More Details" }).click();
  await page.getByRole("button", { name: "Edit Control" }).click();
  await page.getByRole("textbox", { name: "Enter detailed control" }).click();
  await page
    .getByRole("textbox", { name: "Enter detailed control" })
    .fill("Test example updated");
  await page.getByRole("textbox").nth(3).click();
  await page.getByRole("textbox").nth(3).fill("Test Owner updated");
  await page.getByRole("textbox").nth(4).click();
  await page.getByRole("textbox").nth(4).fill("SME updated");
  await page.locator("label").filter({ hasText: "Yes" }).click();
  await page.getByRole("button", { name: "Save Changes" }).click();
});
