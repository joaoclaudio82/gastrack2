import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoading(page: Page): Promise<void> {
  const spinner = page.locator('app-loading-spinner, [data-loading="true"]');
  // Wait for spinner to appear (if it will) and then disappear
  await spinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
    // Spinner might not appear if data loads fast
  });
}

/**
 * List-item selector: matches both table rows AND card-based lists.
 * Tables: `table tbody tr` / `[role="row"]`.
 * Cards: `app-oxygen-tank-card` (e.g. /cylinders) + generic list-item cards
 * (`[role="listitem"]`, `[data-list-item]`).
 */
const LIST_ITEM_SELECTOR =
  'table tbody tr, [role="row"], app-oxygen-tank-card, [role="listitem"], [data-list-item]';

/**
 * Wait for a list (table or cards) to have data
 */
export async function waitForTableData(page: Page, minRows = 1): Promise<void> {
  await waitForLoading(page);
  const rows = page.locator(LIST_ITEM_SELECTOR);
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(minRows);
}

/**
 * Get list item count (table rows or cards)
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await waitForLoading(page);
  const rows = page.locator(LIST_ITEM_SELECTOR);
  return rows.count();
}

/** Alias for waitForTableData — reads better on card-based lists. */
export const waitForListData = waitForTableData;

/** Alias for getTableRowCount — reads better on card-based lists. */
export const getListItemCount = getTableRowCount;

/**
 * Click on a table row action button
 */
export async function clickTableAction(
  page: Page,
  rowIndex: number,
  actionName: string,
): Promise<void> {
  const row = page.locator('table tbody tr').nth(rowIndex);
  const actionButton = row.getByRole('button', { name: actionName });
  await actionButton.click();
}

/**
 * Fill a form field by label
 */
export async function fillField(page: Page, label: string, value: string): Promise<void> {
  await page.getByLabel(label).fill(value);
}

/**
 * Select an option from a select/dropdown by label
 */
export async function selectOption(page: Page, label: string, optionText: string): Promise<void> {
  const select = page.getByLabel(label);
  await select.click();
  await page.getByRole('option', { name: optionText }).click();
}

/**
 * Assert toast/notification message
 */
export async function expectToast(page: Page, message: string | RegExp): Promise<void> {
  // .first(): pode haver mais de um container de toast/alert no DOM (strict mode).
  const toast = page.locator('[role="alert"], .toast, [data-toast]').filter({ hasText: message });
  await expect(toast.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Assert empty state is shown
 */
export async function expectEmptyState(page: Page): Promise<void> {
  await expect(page.locator('app-empty-state, [data-empty-state]')).toBeVisible();
}

/**
 * Navigate to a route and wait for load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForLoading(page);
}

/**
 * Click sidebar link by name
 */
export async function clickSidebarLink(page: Page, linkName: string): Promise<void> {
  const menuNav = page.getByRole('navigation', { name: 'Menu de navegação' });
  await menuNav.getByRole('link', { name: linkName }).click();
  await waitForLoading(page);
}

/**
 * Open modal/dialog by clicking a button
 */
export async function openModal(page: Page, buttonName: string): Promise<Locator> {
  await page.getByRole('button', { name: buttonName }).click();
  const modal = page.locator('[role="dialog"], .modal, app-modal');
  await expect(modal).toBeVisible();
  return modal;
}

/**
 * Close modal by clicking close button or backdrop
 */
export async function closeModal(page: Page): Promise<void> {
  const closeButton = page.locator('[role="dialog"] button[aria-label="Fechar"], .modal-close');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Click backdrop
    await page.locator('.modal-backdrop, [data-backdrop]').click();
  }
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
}

/**
 * Submit form and wait for response
 */
export async function submitForm(page: Page, buttonName = 'Salvar'): Promise<void> {
  await page.getByRole('button', { name: buttonName }).click();
  await waitForLoading(page);
}

/**
 * Confirm delete dialog
 */
export async function confirmDelete(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', { name: /Confirmar|Excluir|Sim/i });
  await confirmButton.click();
  await waitForLoading(page);
}

/**
 * Assert page title/heading
 */
export async function expectPageTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
}

/**
 * Assert breadcrumb contains text
 */
export async function expectBreadcrumb(page: Page, text: string): Promise<void> {
  await expect(page.locator('app-breadcrumb, nav[aria-label="Breadcrumb"]')).toContainText(text);
}

/**
 * Filter table by status dropdown
 */
export async function filterByStatus(page: Page, status: string): Promise<void> {
  await page.getByLabel(/Status/i).click();
  await page.getByRole('option', { name: status }).click();
  await waitForLoading(page);
}

/**
 * Search in table
 */
export async function searchTable(page: Page, term: string): Promise<void> {
  const searchInput = page.getByPlaceholder(/Buscar|Pesquisar|Search/i);
  await searchInput.fill(term);
  await searchInput.press('Enter');
  await waitForLoading(page);
}

/**
 * Paginate to next page
 */
export async function goToNextPage(page: Page): Promise<void> {
  const nextButton = page.getByRole('button', { name: /Próxima|Next|>/i });
  await nextButton.click();
  await waitForLoading(page);
}

/**
 * Assert current page number
 */
export async function expectCurrentPage(page: Page, pageNumber: number): Promise<void> {
  await expect(page.locator('[aria-current="page"], .pagination-active')).toContainText(
    String(pageNumber),
  );
}
