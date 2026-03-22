import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Quark/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unauthenticated users are redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("magic link form is present", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
  });
});
