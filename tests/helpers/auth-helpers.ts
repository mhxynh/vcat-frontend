import { Page } from "@playwright/test";

// Credentials are read from environment variables so tests can run against
// different environments without changing code. Set these in your CI or a
// local .env file (Playwright doesn't auto-load .env — use your runner to set
// environment variables or add dotenv loading in a setup script).
const MANAGER_EMAIL = process.env.VCAT_MANAGER_EMAIL;
const MANAGER_PASSWORD = process.env.VCAT_MANAGER_PASSWORD;
const TESTER_EMAIL = process.env.VCAT_TESTER_EMAIL;
const TESTER_PASSWORD = process.env.VCAT_TESTER_PASSWORD;

export async function loginAsManager(page: Page) {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page.getByRole("textbox", { name: "Email Address" }).fill(MANAGER_EMAIL);
  await page.getByRole("textbox", { name: "Password Forgot password?" }).click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill(MANAGER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function loginAsTester(page: Page) {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email Address" }).click();
  await page.getByRole("textbox", { name: "Email Address" }).fill(TESTER_EMAIL);
  await page.getByRole("textbox", { name: "Password Forgot password?" }).click();
  await page
    .getByRole("textbox", { name: "Password Forgot password?" })
    .fill(TESTER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}
