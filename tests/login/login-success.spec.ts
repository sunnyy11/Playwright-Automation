import { test, expect } from '../../fixtures/pom.fixture';
import { credentials } from '../../config';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login page core scenarios', () => {
  test(
    'keeps the login form open when submitted empty',
    { tag: '@smoke' },
    async ({ page, loginPage }) => {
      // 1. Open the login page in a fresh state.
      await loginPage.goto();
      await expect(loginPage.usernameInput).toBeEmpty();
      await expect(loginPage.passwordInput).toBeEmpty();
      await expect(loginPage.loginButton).toBeEnabled();

      // 2. Leave both fields blank and click Login.
      await loginPage.submit();
      await expect(page).toHaveURL(/\/web\/index\.php\/auth\/login/);

      // 3. Check the field states after submission.
      await expect(loginPage.usernameInput).toBeEmpty();
      await expect(loginPage.passwordInput).toBeEmpty();
    },
  );

  test(
    'logs in successfully with valid credentials',
    { tag: '@smoke' },
    async ({ page, loginPage, dashboardPage }) => {
      // 1. Navigate to the OrangeHRM login page on a fresh browser session.
      await loginPage.goto();
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      // 2. Enter the valid username 'Admin' and password 'admin123'.
      await loginPage.login(credentials.username, credentials.password);

      // 3. Confirm the login completed.
      await expect(page).toHaveURL(/\/web\/index\.php\/dashboard\/index/);

      // 4. Confirm the main dashboard content is visible after login.
      await expect(dashboardPage.heading).toBeVisible();
      await expect(dashboardPage.timeAtWorkPanel).toBeVisible();
    },
  );
});
