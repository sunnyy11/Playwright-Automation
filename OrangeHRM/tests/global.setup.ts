import { expect, test as setup } from '@playwright/test';
import { credentials } from '../config';
import { LoginPage } from '../pages/login.page';

const authFile = '.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credentials.username, credentials.password);
  await expect(page).toHaveURL(/dashboard\/index/);
  await page.context().storageState({ path: authFile });
});
