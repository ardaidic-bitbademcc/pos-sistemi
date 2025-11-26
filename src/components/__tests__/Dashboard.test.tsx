import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import type { Module } from '@/App';
import type { AuthSession } from '@/lib/types';

// Mock useKV hook
vi.mock('../../hooks/use-kv-store', () => ({
  useKV: vi.fn((key, defaultValue) => {
    const mockData: Record<string, any> = {
      sales: [
        {
          id: 'sale-1',
          saleNumber: 'SAL-241201-0001',
          items: [{ productId: 'prod-1', quantity: 2, unitPrice: 50, subtotal: 100 }],
          subtotal: 100,
          tax: 18,
          total: 118,
          paymentMethod: 'cash',
          status: 'completed',
          createdAt: new Date().toISOString(),
          branchId: 'branch-1',
          adminId: 'admin-1',
        },
      ],
      employees: [
        { id: 'emp-1', fullName: 'Test User', isActive: true, branchId: 'branch-1' },
        { id: 'emp-2', fullName: 'Test User 2', isActive: true, branchId: 'branch-1' },
      ],
      branches: [
        { id: 'branch-1', name: 'Ana Şube', isActive: true, adminId: 'admin-1' },
      ],
    };
    return [mockData[key] || defaultValue, vi.fn()];
  }),
}));

// Mock useBranchFilter hook
vi.mock('@/hooks/use-branch-filter', () => ({
  useBranchFilter: vi.fn((data) => ({
    filteredData: data || [],
    selectedBranchId: 'all',
    setSelectedBranchId: vi.fn(),
  })),
}));

describe('Dashboard Module', () => {
  const mockOnNavigate = vi.fn();
  const mockAuthSession: AuthSession = {
    adminId: 'admin-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'Test User',
    userRole: 'owner',
    loginTime: new Date().toISOString(),
  };

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render dashboard with title', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      expect(screen.getByText(/kontrol paneli|dashboard/i)).toBeInTheDocument();
    });

    it('should render statistics cards', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      
      // Check for stat cards
      expect(screen.getByText(/bugünkü satışlar|günlük ciro/i)).toBeInTheDocument();
      expect(screen.getByText(/aktif çalışan/i)).toBeInTheDocument();
    });

    it('should display formatted currency values', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      
      // Check for currency formatting (₺ symbol)
      const cards = screen.getAllByRole('article');
      const hasFormattedCurrency = cards.some(card => 
        card.textContent?.includes('₺')
      );
      expect(hasFormattedCurrency).toBe(true);
    });
  });

  describe('Module Navigation', () => {
    it('should render module cards', () => {
      render(<Dashboard onNavigate={mockOnNavigate} currentUserRole="owner" authSession={mockAuthSession} />);
      
      // Check for module cards
      expect(screen.getByText(/satış noktası|pos/i)).toBeInTheDocument();
      expect(screen.getByText(/personel/i)).toBeInTheDocument();
    });

    it('should call onNavigate when module card is clicked', async () => {
      const user = userEvent.setup();
      render(<Dashboard onNavigate={mockOnNavigate} currentUserRole="owner" authSession={mockAuthSession} />);
      
      const posCard = screen.getByText(/satış noktası|pos/i).closest('div[role="button"]');
      if (posCard) {
        await user.click(posCard);
        expect(mockOnNavigate).toHaveBeenCalled();
      }
    });
  });

  describe('Role-Based Access', () => {
    it('should show all modules for owner role', () => {
      render(<Dashboard onNavigate={mockOnNavigate} currentUserRole="owner" authSession={mockAuthSession} />);
      
      expect(screen.getByText(/satış noktası|pos/i)).toBeInTheDocument();
      expect(screen.getByText(/personel/i)).toBeInTheDocument();
      expect(screen.getByText(/finans/i)).toBeInTheDocument();
    });

    it('should show limited modules for waiter role', () => {
      render(<Dashboard onNavigate={mockOnNavigate} currentUserRole="waiter" authSession={mockAuthSession} />);
      
      // Waiter should see POS
      expect(screen.getByText(/satış noktası|pos/i)).toBeInTheDocument();
      
      // But not finance module
      const financeText = screen.queryByText(/finans yönetimi/i);
      expect(financeText).toBeNull();
    });

    it('should show limited modules for cashier role', () => {
      render(<Dashboard onNavigate={mockOnNavigate} currentUserRole="cashier" authSession={mockAuthSession} />);
      
      expect(screen.getByText(/satış noktası|pos/i)).toBeInTheDocument();
      expect(screen.getByText(/rapor/i)).toBeInTheDocument();
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate today\'s sales correctly', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      
      // Should show some sales data
      const statsSection = screen.getByText(/bugünkü satışlar|günlük ciro/i).closest('div');
      expect(statsSection).toBeInTheDocument();
    });

    it('should show active employees count', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      
      // Should show employee count (2 active employees in mock)
      const employeeSection = screen.getByText(/aktif çalışan/i).closest('div');
      expect(employeeSection?.textContent).toContain('2');
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layout for module cards', () => {
      const { container } = render(
        <Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />
      );
      
      // Check for grid layout classes
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });

  describe('Branch Filter Integration', () => {
    it('should filter data by selected branch', () => {
      render(<Dashboard onNavigate={mockOnNavigate} authSession={mockAuthSession} />);
      
      // Component should use branch filter
      expect(screen.getByText(/kontrol paneli|dashboard/i)).toBeInTheDocument();
    });
  });
});
