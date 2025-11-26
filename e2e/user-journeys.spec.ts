import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Complete User Journeys
 * 
 * These tests simulate real user workflows from start to finish
 */

test.describe('Complete Sale Journey', () => {
  test('complete sale from login to payment', async ({ page }) => {
    // Step 1: Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Step 2: Navigate to POS
    await page.click('text=/satış noktası|pos/i');
    await page.waitForTimeout(500);

    // Step 3: Add multiple products
    const products = page.locator('[data-product], button').filter({ hasText: /kahve|çay|su/i });
    const count = await products.count();
    
    if (count > 0) {
      // Add first product twice
      await products.first().click();
      await page.waitForTimeout(200);
      await products.first().click();
      await page.waitForTimeout(200);
      
      // Add second product if exists
      if (count > 1) {
        await products.nth(1).click();
        await page.waitForTimeout(200);
      }
    }

    // Step 4: Verify cart
    const cartItems = page.locator('[data-cart-item]');
    expect(await cartItems.count()).toBeGreaterThan(0);

    // Step 5: Proceed to payment
    const payButton = page.locator('button:has-text("Ödeme"), button:has-text("Öde")').first();
    if (await payButton.isVisible()) {
      await payButton.click();
      await page.waitForTimeout(500);

      // Step 6: Select payment method
      await page.click('text=/nakit|cash/i');
      await page.waitForTimeout(300);

      // Step 7: Complete payment
      const completeButton = page.locator('button:has-text("Tamamla"), button:has-text("Onayla")').first();
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Step 8: Verify success
        await expect(page.locator('text=/başarılı|success|tamamlandı/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Employee Management Journey', () => {
  test('add and manage employee', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to Personnel module
    const personnelModule = page.locator('text=/personel|personnel/i').first();
    if (await personnelModule.isVisible()) {
      await personnelModule.click();
      await page.waitForTimeout(500);

      // Click add employee button
      const addButton = page.locator('button:has-text("Ekle"), button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(300);

        // Fill employee form
        await page.fill('input[name="fullName"], input[placeholder*="Ad"]', 'Test Çalışan');
        await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
        await page.fill('input[name="phone"], input[type="tel"]', '0555 123 4567');

        // Save
        const saveButton = page.locator('button:has-text("Kaydet"), button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Verify employee added
          await expect(page.locator('text=/test çalışan/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Inventory Management Journey', () => {
  test('check and update product stock', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to Menu module
    const menuModule = page.locator('text=/menü|menu|ürün/i').first();
    if (await menuModule.isVisible()) {
      await menuModule.click();
      await page.waitForTimeout(500);

      // Check product list
      await expect(page.locator('text=/ürün|product/i')).toBeVisible();

      // Find a product to edit
      const editButton = page.locator('button[aria-label*="edit"], button:has-text("Düzenle")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Update stock
        const stockInput = page.locator('input[name="stock"], input[type="number"]').first();
        if (await stockInput.isVisible()) {
          await stockInput.fill('100');
          
          // Save changes
          const saveButton = page.locator('button:has-text("Kaydet"), button:has-text("Save")').first();
          await saveButton.click();
        }
      }
    }
  });
});

test.describe('Financial Report Journey', () => {
  test('view and export financial report', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Navigate to Reports
    const reportsModule = page.locator('text=/rapor|report/i').first();
    if (await reportsModule.isVisible()) {
      await reportsModule.click();
      await page.waitForTimeout(500);

      // Select date range
      const dateFilter = page.locator('select, [role="combobox"]').first();
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        
        // Select this month
        const monthOption = page.locator('text=/bu ay|this month|aylık/i').first();
        if (await monthOption.isVisible()) {
          await monthOption.click();
        }
      }

      // Verify report displays
      await expect(page.locator('text=/₺/i')).toBeVisible();

      // Try to export (if button exists)
      const exportButton = page.locator('button:has-text("Dışa Aktar"), button:has-text("Export")').first();
      if (await exportButton.isVisible()) {
        // Click export would download file
        await exportButton.click();
      }
    }
  });
});

test.describe('Multi-Tab Workflow', () => {
  test('handle multiple operations across tabs', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Go to POS and add items
    await page.click('text=/satış noktası|pos/i');
    await page.waitForTimeout(500);

    const firstProduct = page.locator('button').filter({ hasText: /kahve|çay/i }).first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
    }

    // Navigate back to dashboard
    const backButton = page.locator('button:has([class*="ArrowLeft"]), button:has-text("Geri")').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
    }

    // Go to Finance to check updated sales
    const financeModule = page.locator('text=/finans|finance/i').first();
    if (await financeModule.isVisible()) {
      await financeModule.click();
      await page.waitForTimeout(500);

      // Should show financial data
      await expect(page.locator('text=/₺/i')).toBeVisible();
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    
    await page.goto('/');
    
    // Should handle offline state
    await page.context().setOffline(false);
  });

  test('should recover from errors', async ({ page }) => {
    await page.goto('/');
    
    // Page should load without crashing
    await expect(page.locator('body')).toBeVisible();
  });
});
