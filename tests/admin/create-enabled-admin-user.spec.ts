import { expect, test } from '../fixtures/pom.fixture';
import { credentials } from '../../config';
import { faker } from '@faker-js/faker';

test.describe('OrangeHRM User Management', () => {
  test('Create an enabled Admin user with valid details', async ({ page, loginPage, adminPage }) => {
    const username = faker.internet.username();
    const password = `Pw${faker.string.alphanumeric(10)}!`;

    // 1. Open the OrangeHRM login page.
    await loginPage.goto();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // 2. Enter Admin credentials and log in.
    await loginPage.login(credentials.username, credentials.password);
    await loginPage.submit();
    await expect(page).toHaveURL(/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // 3-4. Open Admin and the Add User form.
    await adminPage.openAddUserForm();
    await expect(adminPage.addUserHeading).toBeVisible();

    // 5. Select Admin as the User Role.
    await adminPage.selectUserRole('Admin');
    await expect(adminPage.userRoleSelect).toHaveText('Admin');

    // 6. Select a valid employee record required by OrangeHRM.
    await adminPage.selectEmployee('Ranga', 'Ranga Akunuri');
    await expect(adminPage.employeeNameInput).toHaveValue(/Ranga\s+Akunuri/);

    // 7. Select Enabled as the user status.
    await adminPage.selectStatus('Enabled');
    await expect(adminPage.statusSelect).toHaveText('Enabled');

    // 8. Enter username, password, and matching confirmation.
    await adminPage.fillUserCredentials(username, password);
    await expect(adminPage.usernameInput).toHaveValue(username);
    await expect(adminPage.passwordInput).toHaveValue(password);
    await expect(adminPage.confirmPasswordInput).toHaveValue(password);

    // 9. Save the new Admin user.
    await adminPage.saveUser();
    await expect(adminPage.successToast).toBeVisible();
  });
});
