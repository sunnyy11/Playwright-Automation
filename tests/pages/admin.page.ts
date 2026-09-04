import { type Locator, type Page } from '@playwright/test';

export class AdminPage {
  readonly systemUsersHeading: Locator;
  readonly addUserButton: Locator;
  readonly addUserHeading: Locator;
  readonly userRoleSelect: Locator;
  readonly employeeNameInput: Locator;
  readonly statusSelect: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  constructor(private readonly page: Page) {
    this.systemUsersHeading = page.getByRole('heading', { name: 'System Users' });
    this.addUserButton = page.getByRole('button', { name: /Add/ });
    this.addUserHeading = page.getByRole('heading', { name: 'Add User' });
    this.userRoleSelect = page.locator('div.oxd-select-text').first();
    this.employeeNameInput = page.locator('input[placeholder="Type for hints..."]');
    this.statusSelect = page.locator('div.oxd-select-text').nth(1);
    this.usernameInput = page.locator('input[autocomplete="off"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.successToast = page.getByText('Successfully Saved');
  }

  async openAddUserForm(): Promise<void> {
    await this.page.locator('a.oxd-main-menu-item[href="/web/index.php/admin/viewAdminModule"]').click();
    await this.systemUsersHeading.waitFor({ state: 'visible' });
    await this.addUserButton.click();
    await this.addUserHeading.waitFor({ state: 'visible' });
  }

  async selectUserRole(role: string): Promise<void> {
    await this.userRoleSelect.click();
    await this.page.getByRole('option', { name: role, exact: true }).click();
  }

  async selectEmployee(searchText: string, employeeName: string): Promise<void> {
    await this.employeeNameInput.fill(searchText);
    await this.page.getByRole('option', { name: employeeName, exact: true }).click();
  }

  async selectStatus(status: string): Promise<void> {
    await this.statusSelect.click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
  }

  async fillUserCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  async saveUser(): Promise<void> {
    await this.saveButton.click();
  }
}
