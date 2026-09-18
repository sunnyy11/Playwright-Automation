import { expect, test } from '../../fixtures/pom.fixture';
import { employeeName, employeeSearchTerm } from '../../config';
import { faker } from '@faker-js/faker';

test.describe('OrangeHRM User Management', () => {
  test(
    'creates an enabled Admin user with valid details',
    { tag: '@regression' },
    async ({ adminPage }) => {
      const username = faker.internet.username();
      const password = `Pw${faker.string.alpha(10)}${faker.number.int({ min: 0, max: 9 })}!`;

      await test.step('open the Add User form', async () => {
        await adminPage.openAddUserForm();
      });

      await expect(adminPage.addUserHeading).toBeVisible();

      await test.step('select the role and employee', async () => {
        await adminPage.selectUserRole('Admin');
        await adminPage.selectEmployee(employeeSearchTerm, employeeName);
      });

      await expect(adminPage.userRoleSelect).toHaveText('Admin');
      await expect(adminPage.employeeNameInput).toHaveValue(
        new RegExp(employeeName.trim().replace(/\s+/g, '\\s+')),
      );

      await test.step('enter enabled user credentials', async () => {
        await adminPage.selectEnabledStatus();
        await adminPage.fillUserCredentials(username, password);
      });

      await expect(adminPage.statusSelect).toHaveText('Enabled');
      await expect(adminPage.usernameInput).toHaveValue(username);

      try {
        await test.step('save the new Admin user', async () => {
          await adminPage.saveUser();
        });

        await expect(adminPage.successToast).toBeVisible();
      } finally {
        await adminPage.deleteUserIfPresent(username);
      }
    },
  );
});
