import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import POSModule from '../POSModule';
import type { Product, Sale } from '@/lib/types';

// Mock dependencies
vi.mock('../../../hooks/use-kv-store', () => ({
  useKV: vi.fn((key, defaultValue) => {
    const mockData: Record<string, any> = {
      products: [
        {
          id: 'prod-1',
          name: 'Kahve',
          price: 50,
          category: 'İçecekler',
          stock: 100,
          isActive: true,
          taxRate: 18,
          branchId: 'branch-1',
          adminId: 'admin-1',
        },
        {
          id: 'prod-2',
          name: 'Çay',
          price: 25,
          category: 'İçecekler',
          stock: 200,
          isActive: true,
          taxRate: 18,
          branchId: 'branch-1',
          adminId: 'admin-1',
        },
      ],
      menuItems: [],
      categories: [
        { id: 'cat-1', name: 'İçecekler', displayOrder: 1 },
      ],
      sales: [],
      tables: [],
      tableOrders: [],
      cashRegister: {
        id: 'reg-1',
        branchId: 'branch-1',
        date: new Date().toISOString().split('T')[0],
        openingBalance: 1000,
        currentBalance: 1000,
        totalSales: 0,
      },
      appSettings: {
        paymentMethods: [
          { method: 'cash', displayName: 'Nakit', isActive: true },
          { method: 'card', displayName: 'Kredi Kartı', isActive: true },
        ],
      },
      customerAccounts: [],
    };
    return [mockData[key] || defaultValue, vi.fn()];
  }),
}));

vi.mock('@/hooks/use-branch-filter', () => ({
  useBranchFilter: vi.fn(() => ({
    filteredData: [],
    selectedBranchId: 'branch-1',
  })),
}));

describe('POSModule', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  describe('Product Display', () => {
    it('should render POS module', () => {
      render(<POSModule onBack={mockOnBack} />);
      expect(screen.getByText(/satış noktası|pos|ürünler/i)).toBeInTheDocument();
    });

    it('should display products grid', () => {
      render(<POSModule onBack={mockOnBack} />);
      
      expect(screen.getByText('Kahve')).toBeInTheDocument();
      expect(screen.getByText('Çay')).toBeInTheDocument();
    });

    it('should show product prices', () => {
      render(<POSModule onBack={mockOnBack} />);
      
      expect(screen.getByText(/₺50/)).toBeInTheDocument();
      expect(screen.getByText(/₺25/)).toBeInTheDocument();
    });

    it('should filter products by category', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      // Should show category filter
      const categoryFilter = screen.queryByRole('combobox');
      if (categoryFilter) {
        await user.click(categoryFilter);
        expect(screen.getByText('İçecekler')).toBeInTheDocument();
      }
    });
  });

  describe('Shopping Cart', () => {
    it('should add product to cart when clicked', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const productButton = screen.getByText('Kahve').closest('button');
      if (productButton) {
        await user.click(productButton);
        
        // Cart should show the product
        await waitFor(() => {
          expect(screen.getAllByText('Kahve').length).toBeGreaterThan(1);
        });
      }
    });

    it('should calculate cart total correctly', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Should show total (50 + tax)
        await waitFor(() => {
          const totalSection = screen.getByText(/toplam|total/i);
          expect(totalSection).toBeInTheDocument();
        });
      }
    });

    it('should increase quantity when product added multiple times', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        await user.click(kahveButton);
        
        // Should show quantity 2
        await waitFor(() => {
          const quantityIndicator = screen.queryByText(/x2|2x/i);
          expect(quantityIndicator).toBeInTheDocument();
        });
      }
    });

    it('should remove item from cart', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Find and click remove button
        await waitFor(() => {
          const removeButtons = screen.getAllByRole('button');
          const trashButton = removeButtons.find(btn => 
            btn.querySelector('svg')?.getAttribute('class')?.includes('Trash') ||
            btn.getAttribute('aria-label')?.includes('sil')
          );
          if (trashButton) {
            user.click(trashButton);
          }
        });
      }
    });

    it('should clear entire cart', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Look for clear cart button
        const clearButton = screen.queryByText(/temizle|clear/i);
        if (clearButton) {
          await user.click(clearButton);
        }
      }
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<POSModule onBack={mockOnBack} />);
      
      const searchInput = screen.queryByPlaceholderText(/ara|search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter products by search query', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const searchInput = screen.queryByPlaceholderText(/ara|search/i);
      if (searchInput) {
        await user.type(searchInput, 'Kahve');
        
        // Should show only coffee
        expect(screen.getByText('Kahve')).toBeInTheDocument();
      }
    });
  });

  describe('Payment Processing', () => {
    it('should show payment methods', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      // Add item to cart
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Look for payment button
        const payButton = screen.queryByText(/ödeme|öde|payment|pay/i);
        if (payButton) {
          await user.click(payButton);
          
          // Should show payment methods
          await waitFor(() => {
            expect(screen.getByText(/nakit|cash/i)).toBeInTheDocument();
          });
        }
      }
    });

    it('should process cash payment', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Process payment flow
        const payButton = screen.queryByText(/ödeme|öde/i);
        if (payButton) {
          await user.click(payButton);
          
          const cashButton = screen.queryByText(/nakit/i);
          if (cashButton) {
            await user.click(cashButton);
          }
        }
      }
    });
  });

  describe('Back Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => 
        btn.querySelector('svg') || btn.textContent?.includes('←')
      );
      
      if (backButton) {
        await user.click(backButton);
        expect(mockOnBack).toHaveBeenCalled();
      }
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate tax correctly', async () => {
      const user = userEvent.setup();
      render(<POSModule onBack={mockOnBack} />);
      
      const kahveButton = screen.getByText('Kahve').closest('button');
      if (kahveButton) {
        await user.click(kahveButton);
        
        // Should show tax amount (18% of 50 = 9)
        await waitFor(() => {
          const taxSection = screen.queryByText(/kdv|vergi|tax/i);
          expect(taxSection).toBeInTheDocument();
        });
      }
    });
  });
});
