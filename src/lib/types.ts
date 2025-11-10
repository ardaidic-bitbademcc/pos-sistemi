export type UserRole = 'owner' | 'manager' | 'cashier' | 'chef' | 'staff';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  minStockLevel: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface Sale {
  id: string;
  branchId: string;
  cashierId: string;
  saleNumber: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  subtotal: number;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  avatarUrl?: string;
  isActive: boolean;
  hourlyRate: number;
  employeePin: string;
  qrCode?: string;
}

export interface Shift {
  id: string;
  branchId: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime?: string;
  breakDuration: number;
  totalHours: number;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'absent';
}

export interface SalaryCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'rejected' | 'paid';
  totalHours: number;
  rejectionReason?: string;
  calculationSettings?: SalaryCalculationSettings;
}

export interface SalaryCalculationSettings {
  id: string;
  name: string;
  standardHoursPerMonth: number;
  overtimeMultiplier: number;
  nightShiftMultiplier: number;
  weekendMultiplier: number;
  includeBreaksInCalculation: boolean;
  autoApproveThreshold?: number;
}

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentSaleId?: string;
  section?: string;
}

export interface TableOrder {
  id: string;
  tableId: string;
  saleId: string;
  openedAt: string;
  closedAt?: string;
  customersCount: number;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  targetCostPercentage: number;
  isActive: boolean;
  imageUrl?: string;
  popularity: number;
  profitMargin: number;
}

export type MenuCategory = 'star' | 'puzzle' | 'plow_horse' | 'dog';

export interface MenuAnalysis {
  menuItemId: string;
  category: MenuCategory;
  totalSales: number;
  revenue: number;
  cost: number;
  profit: number;
  popularityScore: number;
  recommendation: string;
}

export interface Expense {
  id: string;
  branchId: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: string;
  sourceType: 'manual' | 'salary' | 'inventory' | 'other';
}

export interface Income {
  id: string;
  branchId: string;
  saleId?: string;
  amount: number;
  date: string;
  description?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  period: {
    start: string;
    end: string;
  };
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  lowStockItems: number;
  activeEmployees: number;
  pendingApprovals: number;
}
