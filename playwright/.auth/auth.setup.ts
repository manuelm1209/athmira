import path from "node:path";
import dotenv from "dotenv";
import { test as setup, expect } from "@playwright/test";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";

setup("authenticate Codex test user", async ({ page }) => {
  const email = process.env.CODEX_TEST_EMAIL;
  const password = process.env.CODEX_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing CODEX_TEST_EMAIL or CODEX_TEST_PASSWORD. Add them to .env.local or pass them in the terminal command."
    );
  }

  await page.goto(`${baseURL}/auth/login`);

  const emailInput = page
    .getByLabel(/correo|email/i)
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[name="email"]'))
    .or(page.locator('input[autocomplete="email"]'))
    .first();

  const passwordInput = page
    .getByLabel(/contraseña|password/i)
    .or(page.locator('input[type="password"]'))
    .or(page.locator('input[name="password"]'))
    .or(page.locator('input[autocomplete="current-password"]'))
    .or(page.locator('input[autocomplete="password"]'))
    .first();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page
    .getByRole("button", {
      name: /iniciar sesion|iniciar sesión|sign in|log in|ingresar/i,
    })
    .or(page.locator('button[type="submit"]'))
    .first()
    .click();

  await expect(page).not.toHaveURL(/\/auth\/login/);

  await page.context().storageState({
    path: "playwright/.auth/codex-user.json",
  });
});