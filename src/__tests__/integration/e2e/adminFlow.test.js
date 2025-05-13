import { test, expect } from '@playwright/test';
import { mockInfluencers, mockClaims } from '../../../mocks/data';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/influencers', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(mockInfluencers)
      });
    });

    await page.route('**/api/claims', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify(mockClaims)
      });
    });

    // Navigate to dashboard
    await page.goto('/');
  });

  test('admin can navigate through main sections', async ({ page }) => {
    // Check dashboard is loaded
    await expect(page.getByText('Dashboard de Influenciadores')).toBeVisible();
    
    // Navigate to Influencers
    await page.click('text=Influenciadores');
    await expect(page.url()).toContain('/influencers');
    await expect(page.getByText('Médicos Influenciadores')).toBeVisible();

    // Navigate to Claims
    await page.click('text=Alegações');
    await expect(page.url()).toContain('/claims');

    // Navigate to Reports
    await page.click('text=Relatórios');
    await expect(page.url()).toContain('/reports');
    await expect(page.getByText('Gerar Novo Relatório')).toBeVisible();

    // Navigate to Settings
    await page.click('text=Configurações');
    await expect(page.url()).toContain('/settings');
  });

  test('admin can search and filter influencers', async ({ page }) => {
    await page.click('text=Influenciadores');
    
    // Test search functionality
    const searchInput = page.getByPlaceholder('Buscar médico...');
    await searchInput.fill('João Silva');
    await page.click('button:text("Buscar")');
    
    // Verify filtered results
    await expect(page.getByText('João Silva')).toBeVisible();
    await expect(page.getByText('Maria Santos')).not.toBeVisible();

    // Test category filter
    const categorySelect = page.locator('select.category-select');
    await categorySelect.selectOption('Neurologia');
    
    // Verify category filter applied
    await expect(page.getByText('Neurologia')).toBeVisible();
  });

  test('admin can view influencer details', async ({ page }) => {
    await page.click('text=Influenciadores');
    await page.click('text=João Silva');
    
    // Verify influencer details page
    await expect(page.url()).toContain('/influencer/');
    await expect(page.getByText('Total de Alegações')).toBeVisible();
    await expect(page.getByText('Verificadas')).toBeVisible();
    
    // Check tabs functionality
    await page.click('text=Análises');
    await page.click('text=Histórico');
  });

  test('admin can generate and export reports', async ({ page }) => {
    await page.click('text=Relatórios');
    
    // Select report type
    await page.locator('select[name="reportType"]').selectOption('influencer');
    await page.click('text=Gerar Relatório');
    
    // Verify report generation
    await expect(page.getByText('Relatório gerado com sucesso')).toBeVisible();
    
    // Test export functionality
    await page.click('button:text("PDF")');
    await page.click('button:text("CSV")');
    
    // Verify recent reports list
    await expect(page.getByText('Relatórios Recentes')).toBeVisible();
  });

  test('admin can manage system settings', async ({ page }) => {
    await page.click('text=Configurações');
    
    // Test theme toggle
    const themeToggle = page.getByRole('button', { name: /modo escuro/i });
    await themeToggle.click();
    
    // Test notification settings
    const emailNotif = page.getByLabel('Receber notificações por email');
    await emailNotif.check();
    await expect(emailNotif).toBeChecked();
    
    // Test email input
    const emailInput = page.getByPlaceholder('seu@email.com');
    await emailInput.fill('admin@example.com');
    await expect(emailInput).toHaveValue('admin@example.com');
  });

  test('admin can manage trust scores and verification status', async ({ page }) => {
    await page.click('text=Influenciadores');
    await page.click('text=João Silva');
    
    // Verify trust score components
    await expect(page.getByText('Trust Score')).toBeVisible();
    await expect(page.getByText('85%')).toBeVisible();
    
    // Check verification status badges
    await expect(page.getByText('Alta Confiabilidade')).toBeVisible();
    
    // Verify claims section
    await page.click('text=Alegações');
    await expect(page.getByText('Chá verde aumenta o metabolismo em 50%')).toBeVisible();
  });

  test('admin can use search filters effectively', async ({ page }) => {
    await page.click('text=Buscar Influenciadores');
    
    // Test platform filter
    await page.locator('select[name="platform"]').selectOption('Instagram');
    await expect(page.getByText('João Silva')).toBeVisible();
    
    // Test category filter
    await page.locator('select[name="category"]').selectOption('Nutrição');
    
    // Test pagination
    const paginationButtons = page.locator('.pagination button');
    await expect(paginationButtons).toHaveCount(1);
    
    // Test items per page
    await page.locator('select[name="pageSize"]').selectOption('20');
  });
});

test.afterEach(async ({ page }) => {
  // Clean up any test data or state
  await page.evaluate(() => window.localStorage.clear());
});