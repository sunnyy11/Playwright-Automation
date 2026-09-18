import { type Locator, type Page } from '@playwright/test';

export class AdminPage {
  readonly systemUsersHeading: Locator;
  readonly addUserButton: Locator;
  readonly addUserHeading: Locator;
  readonly userRoleSelect: Locator;
  readonly employeeNameInput: Locator;
  readonly statusSelect: Locator;
  readonly usernameInput: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  constructor(private readonly page: Page) {
    this.systemUsersHeading = page.getByRole('heading', { name: 'System Users' });
    this.addUserButton = page.getByRole('button', { name: /Add/ });
    this.addUserHeading = page.getByRole('heading', { name: 'Add User' });
    this.userRoleSelect = page
      .getByText(/^User Role/)
      .locator('../..')
      .locator('[tabindex="0"]');
    this.employeeNameInput = page.getByRole('textbox', { name: 'Type for hints...' });
    this.statusSelect = page
      .getByText(/^Status/)
      .locator('../..')
      .locator('[tabindex="0"]');
    this.usernameInput = page
      .getByText(/^Username/)
      .locator('../..')
      .getByRole('textbox');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.successToast = page.getByText('Successfully Saved', { exact: true });
  }

  async openAddUserForm(): Promise<void> {
    await this.page.goto('/web/index.php/admin/viewAdminModule');
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
    await this.employeeNameInput.press('Tab');
  }

  async selectEnabledStatus(): Promise<void> {
    await this.statusSelect.focus();
    await this.statusSelect.press('ArrowDown');
    await this.statusSelect.press('Enter');
  }

  async fillUserCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    const passwordInputs = await this.page.locator('input[type="password"]').all();
    if (passwordInputs.length !== 2) {
      throw new Error(`Expected two password inputs, found ${passwordInputs.length}`);
    }

    for (const passwordInput of passwordInputs) {
      await passwordInput.fill(password);
    }
  }

  async saveUser(): Promise<void> {
    await this.saveButton.click();
  }

  async deleteUserIfPresent(username: string): Promise<void> {
    const userRow = this.page.getByRole('row').filter({ hasText: username });
    if ((await userRow.count()) === 0) {
      return;
    }

    await userRow.getByRole('button', { name: /Delete/ }).click();
    await this.page.getByRole('button', { name: /Yes, Delete/ }).click();
    await userRow.waitFor({ state: 'detached' });
  }
}
