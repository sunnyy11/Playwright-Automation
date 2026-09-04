import { expect, test, type Locator, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

class AdminUserPage {
  readonly addButton: Locator;
  readonly userRoleSelect: Locator;
  readonly employeeName: Locator;
  readonly statusSelect: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  constructor(private readonly page: Page) {
    this.addButton = page.getByRole('button', { name: /Add/ });
    this.userRoleSelect = page.locator('div.oxd-select-text').first();
    this.employeeName = page.locator('input[placeholder="Type for hints..."]');
    this.statusSelect = page.locator('div.oxd-select-text').nth(1);
    this.username = page.locator('input[autocomplete="off"]').first();
    this.password = page.locator('input[type="password"]').first();
    this.confirmPassword = page.locator('input[type="password"]').nth(1);
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.successToast = page.getByText('Successfully Saved');
  }

  async open(): Promise<void> {
    await this.page.locator('a.oxd-main-menu-item[href="/web/index.php/admin/viewAdminModule"]').click();
    await expect(this.page.getByRole('heading', { name: 'System Users' })).toBeVisible();
    await this.addButton.click();
    await expect(this.page.getByRole('heading', { name: 'Add User' })).toBeVisible();
  }

  async selectRole(role: string): Promise<void> {
    await this.userRoleSelect.click();
    await this.page.getByRole('option', { name: role, exact: true }).click();
  }

  async selectEmployee(searchText: string, employeeName: string): Promise<void> {
    await this.employeeName.fill(searchText);
    await this.page.getByRole('option', { name: employeeName, exact: true }).click();
  }

  async selectStatus(status: string): Promise<void> {
    await this.statusSelect.click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.confirmPassword.fill(password);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}

test.describe('OrangeHRM User Management', () => {
  test('Create an enabled Admin user with valid details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const adminUserPage = new AdminUserPage(page);
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
    await adminUserPage.open();

    // 5. Select Admin as the User Role.
    await adminUserPage.selectRole('Admin');
    await expect(adminUserPage.userRoleSelect).toHaveText('Admin');

    // 6. Select an existing employee from autocomplete suggestions.
    await adminUserPage.selectEmployee('Ranga', 'Ranga Akunuri');
    await expect(adminUserPage.employeeName).toHaveValue(/Ranga\s+Akunuri/);

    // 7. Select Enabled as the user status.
    await adminUserPage.selectStatus('Enabled');
    await expect(adminUserPage.statusSelect).toHaveText('Enabled');

    // 8. Enter username, password, and matching confirmation.
    await adminUserPage.fillCredentials(username, 'Pass123');
    await expect(adminUserPage.username).toHaveValue(username);
    await expect(adminUserPage.password).toHaveValue('Pass123');
    await expect(adminUserPage.confirmPassword).toHaveValue('Pass123');

    // 9. Save the new Admin user.
    await adminUserPage.save();
    await expect(adminUserPage.successToast).toBeVisible();
  });
});