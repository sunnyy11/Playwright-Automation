import { type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly heading: Locator;
  readonly timeAtWorkPanel: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.timeAtWorkPanel = page.getByText('Time at Work', { exact: true });
  }
}
