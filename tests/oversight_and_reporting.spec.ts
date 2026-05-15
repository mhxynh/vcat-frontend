import { test, expect } from '@playwright/test';

test("T42 - View Team Workflow and Bandwidth", async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('textbox', { name: 'Email Address' }).click();
    await page.getByRole('textbox', { name: 'Email Address' }).fill('moniqueh@vanguard.com');
    await page.getByRole('textbox', { name: 'Password Forgot password?' }).click();
    await page.getByRole('textbox', { name: 'Password Forgot password?' }).fill('Vcat2026!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('i', { exact: true }).nth(1).click();
});

test('T43 - View Overall Active Testing Progress', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('textbox', { name: 'Email Address' }).click();
    await page.getByRole('textbox', { name: 'Email Address' }).fill('moniqueh@vanguard.com');
    await page.getByRole('textbox', { name: 'Password Forgot password?' }).click();
    await page.getByRole('textbox', { name: 'Password Forgot password?' }).fill('Vcat2026!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.locator('.dashboard-donut__segment').first().click();
    await page.getByRole('button', { name: 'Next week' }).click();
    await page.getByRole('button', { name: 'Refresh' }).click();
});
