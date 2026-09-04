import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login page core scenarios', () => {
  test('Login with empty credentials shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. Open the login page in a fresh state.
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeEmpty();
    await expect(loginPage.passwordInput).toBeEmpty();
    await expect(loginPage.loginButton).toBeEnabled();

    // 2. Leave both fields blank and click Login.
    await loginPage.submit();
    await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);
    await expect(page.getByText('Required', { exact: true })).toHaveCount(2);

    // 3. Check the field states after submission.
    await expect(loginPage.usernameInput).toBeEmpty();
    await expect(loginPage.passwordInput).toBeEmpty();
  });
});
