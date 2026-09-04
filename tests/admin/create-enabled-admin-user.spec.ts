import { expect, test } from '@playwright/test';
import { AdminPage } from '../pages/admin.page';
import { LoginPage } from '../pages/login.page';

test.describe('OrangeHRM User Management', () => {
  test('Create an enabled Admin user with valid details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminPage = new AdminPage(page);
    const username = `Admin${Date.now()}`;

    // 1. Open the OrangeHRM login page.
    await loginPage.goto();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // 2. Enter Admin credentials and log in.
    await loginPage.login('Admin', 'admin123');
    await loginPage.submit();
    await expect(page).toHaveURL(/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 3-4. Open Admin and the Add User form.
    await adminPage.openAddUserForm();
    await expect(adminPage.systemUsersHeading).toBeVisible();
    await expect(adminPage.addUserHeading).toBeVisible();

    // 5. Select Admin as the User Role.
    await adminPage.selectUserRole('Admin');
    await expect(adminPage.userRoleSelect).toHaveText('Admin');

    // 6. Select an existing employee from autocomplete suggestions.
    await adminPage.selectEmployee('Ranga', 'Ranga Akunuri');
    await expect(adminPage.employeeNameInput).toHaveValue(/Ranga\s+Akunuri/);

    // 7. Select Enabled as the user status.
    await adminPage.selectStatus('Enabled');
    await expect(adminPage.statusSelect).toHaveText('Enabled');

    // 8. Enter username, password, and matching confirmation.
    await adminPage.fillUserCredentials(username, 'Pass123');
    await expect(adminPage.usernameInput).toHaveValue(username);
    await expect(adminPage.passwordInput).toHaveValue('Pass123');
    await expect(adminPage.confirmPasswordInput).toHaveValue('Pass123');

    // 9. Save the new Admin user.
    await adminPage.saveUser();
    await expect(adminPage.successToast).toBeVisible();
  });
});
