import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Login page core scenarios', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 1. Navigate to the OrangeHRM login page on a fresh browser session.
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // 2. Enter the valid username 'Admin' and password 'admin123'.
    await loginPage.login('Admin', 'admin123');
    await expect(loginPage.usernameInput).toHaveValue('Admin');
    await expect(loginPage.passwordInput).toHaveValue('admin123');

    // 3. Click the Login button.
    await loginPage.submit();
    await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

    // 4. Confirm the main dashboard content is visible after login.
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.timeAtWorkPanel).toBeVisible();
  });
});
