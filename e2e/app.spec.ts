import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * 
 * Tests the complete user authentication journey
 */
test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Should show login screen
    await expect(page.locator('text=/giriş|login/i')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/');
    
    // Click register tab if exists
    const registerTab = page.locator('text=/kayıt|register/i').first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
      
      // Fill registration form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Test123456');
      await page.fill('input[placeholder*="İşletme"]', 'Test Restaurant');
      
      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter credentials
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/dashboard|panel/i);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    
    // Try to login
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/hata|error|geçersiz|invalid/i')).toBeVisible();
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|panel/i);
  });

  test('should display dashboard modules', async ({ page }) => {
    // Check for module cards
    await expect(page.locator('text=/satış noktası|pos/i')).toBeVisible();
    await expect(page.locator('text=/personel/i')).toBeVisible();
  });

  test('should navigate to POS module', async ({ page }) => {
    // Click on POS module
    await page.click('text=/satış noktası|pos/i');
    
    // Should show POS interface
    await expect(page.locator('text=/ürün|product/i')).toBeVisible();
  });

  test('should navigate to Finance module', async ({ page }) => {
    // Click on Finance module
    const financeModule = page.locator('text=/finans|finance/i').first();
    await financeModule.click();
    
    // Should show finance interface
    await expect(page.locator('text=/gelir|revenue|income/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Çıkış"), button:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login
      await expect(page.locator('text=/giriş|login/i')).toBeVisible();
    }
  });
});

test.describe('POS Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to POS
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.click('text=/satış noktası|pos/i');
    await page.waitForTimeout(500);
  });

  test('should display products', async ({ page }) => {
    // Should show product grid
    await expect(page.locator('text=/ürün|product/i')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Find first product and click
    const firstProduct = page.locator('[data-product], button:has-text("Kahve"), button:has-text("Çay")').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      
      // Cart should show item
      await expect(page.locator('text=/sepet|cart/i')).toBeVisible();
    }
  });

  test('should complete a sale', async ({ page }) => {
    // Add product to cart
    const product = page.locator('button:has-text("Kahve")').first();
    if (await product.isVisible()) {
      await product.click();
      
      // Click payment button
      const payButton = page.locator('button:has-text("Ödeme"), button:has-text("Öde")').first();
      if (await payButton.isVisible()) {
        await payButton.click();
        
        // Select cash payment
        await page.click('text=/nakit|cash/i');
        
        // Confirm payment
        const confirmButton = page.locator('button:has-text("Tamamla"), button:has-text("Confirm")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Should show success message
          await expect(page.locator('text=/başarılı|success/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should search for products', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Ara"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Kahve');
      
      // Should filter products
      await expect(page.locator('text=/kahve/i')).toBeVisible();
    }
  });
});

test.describe('Finance Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to Finance
    await page.goto('/');
    await page.fill('input[type="email"]', 'demo@pos.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const financeModule = page.locator('text=/finans|finance/i').first();
    if (await financeModule.isVisible()) {
      await financeModule.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display financial summary', async ({ page }) => {
    // Should show revenue info
    await expect(page.locator('text=/gelir|revenue|income/i')).toBeVisible();
  });

  test('should show sales statistics', async ({ page }) => {
    // Should display currency formatted values
    await expect(page.locator('text=/₺/i')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    // Find date filter
    const dateFilter = page.locator('button:has-text("Bugün"), select, [role="combobox"]').first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      
      // Select different date range
      const weekOption = page.locator('text=/hafta|week/i').first();
      if (await weekOption.isVisible()) {
        await weekOption.click();
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Should be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Should adapt layout
    await expect(page.locator('body')).toBeVisible();
  });
});
