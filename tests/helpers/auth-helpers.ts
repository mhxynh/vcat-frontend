import { Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
  await page.goto("/");
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
}

export async function loginAsTester(page: Page) {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page
    .getByRole("textbox", { name: "Email Address" })
    .fill("moniqueh@test.vanguard.com");
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill("VcatTest2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
}
