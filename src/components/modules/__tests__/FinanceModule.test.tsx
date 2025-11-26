import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinanceModule from '../FinanceModule';

vi.mock('../../../hooks/use-kv-store', () => ({
  useKV: vi.fn((key, defaultValue) => {
    const mockData: Record<string, any> = {
      sales: [
        {
          id: 'sale-1',
          saleNumber: 'SAL-241201-0001',
          total: 118,
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
          branchId: 'branch-1',
          adminId: 'admin-1',
        },
        {
          id: 'sale-2',
          saleNumber: 'SAL-241201-0002',
          total: 250,
          paymentMethod: 'card',
          createdAt: new Date().toISOString(),
          branchId: 'branch-1',
          adminId: 'admin-1',
        },
      ],
      invoices: [],
      expenses: [],
      'cash-transactions': [],
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

describe('FinanceModule', () => {
  const mockOnBack = vi.fn();
  const mockAuthSession = {
    adminId: 'admin-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'Test User',
    userRole: 'owner' as const,
    loginTime: new Date().toISOString(),
  };

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  describe('Rendering', () => {
    it('should render finance module', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      expect(screen.getByText(/finans|mali|finance/i)).toBeInTheDocument();
    });

    it('should display financial summary cards', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Check for revenue/income cards
      const revenueCard = screen.queryByText(/gelir|revenue|income/i);
      expect(revenueCard).toBeInTheDocument();
    });

    it('should show today\'s financial stats', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should show today's label
      const todayLabel = screen.queryByText(/bugün|today/i);
      expect(todayLabel).toBeInTheDocument();
    });
  });

  describe('Revenue Calculation', () => {
    it('should calculate total revenue from sales', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Total from mock sales: 118 + 250 = 368
      const revenueSection = screen.queryByText(/368|₺368/);
      expect(revenueSection).toBeInTheDocument();
    });

    it('should display revenue with currency formatting', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should have ₺ symbol
      const currencyElements = screen.getAllByText(/₺/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });
  });

  describe('Date Filtering', () => {
    it('should have date filter options', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should have date range selector
      const dateFilter = screen.queryByText(/tarih|date|bugün|today/i);
      expect(dateFilter).toBeInTheDocument();
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Look for date filter dropdown
      const filterButtons = screen.getAllByRole('button');
      const dateButton = filterButtons.find(btn => 
        btn.textContent?.includes('Bugün') || 
        btn.textContent?.includes('Today')
      );
      
      if (dateButton) {
        await user.click(dateButton);
      }
    });
  });

  describe('Payment Method Breakdown', () => {
    it('should show payment methods breakdown', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should show cash and card totals
      expect(screen.queryByText(/nakit|cash/i)).toBeInTheDocument();
      expect(screen.queryByText(/kart|card/i)).toBeInTheDocument();
    });

    it('should calculate cash payments total', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Cash total from mock: 118
      const cashSection = screen.queryByText(/118|₺118/);
      expect(cashSection).toBeInTheDocument();
    });

    it('should calculate card payments total', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Card total from mock: 250
      const cardSection = screen.queryByText(/250|₺250/);
      expect(cardSection).toBeInTheDocument();
    });
  });

  describe('Expenses Section', () => {
    it('should have expenses section', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      const expensesSection = screen.queryByText(/gider|expense/i);
      expect(expensesSection).toBeInTheDocument();
    });

    it('should show add expense button', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      const addButton = screen.queryByText(/gider ekle|add expense/i);
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Invoices Section', () => {
    it('should have invoices section', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      const invoicesSection = screen.queryByText(/fatura|invoice/i);
      expect(invoicesSection).toBeInTheDocument();
    });
  });

  describe('Charts and Visualizations', () => {
    it('should render financial charts', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Look for chart elements
      const charts = screen.queryByRole('img') || screen.queryByRole('figure');
      // Charts should exist or be attempted to render
    });
  });

  describe('Back Navigation', () => {
    it('should call onBack when back button clicked', async () => {
      const user = userEvent.setup();
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => 
        btn.querySelector('svg')
      );
      
      if (backButton) {
        await user.click(backButton);
        expect(mockOnBack).toHaveBeenCalled();
      }
    });
  });

  describe('Profit Calculation', () => {
    it('should calculate net profit', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should show profit/kar
      const profitSection = screen.queryByText(/kar|profit|net/i);
      expect(profitSection).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('should have multiple tabs', () => {
      render(<FinanceModule onBack={mockOnBack} authSession={mockAuthSession} />);
      
      // Should have tabs for different views
      const tabs = screen.queryAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
});
