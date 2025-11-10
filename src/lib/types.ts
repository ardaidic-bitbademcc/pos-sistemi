export type UserRole = 'owner' | 'manager' | 'cashier' | 'chef' | 'staff' | 'waiter';

export type ModulePermission = 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports';

export interface RolePermissions {
  role: UserRole;
  permissions: ModulePermission[];
  canViewFinancials: boolean;
  canEditPrices: boolean;
  canManageUsers: boolean;
  canApprovePayments: boolean;
}

export interface BranchComparison {
  branchId: string;
  branchName: string;
  currentWeekSales: number;
  lastWeekSales: number;
  percentageChange: number;
  amountChange: number;
}

export interface WaiterSalesReport {
  waiterId: string;
  waiterName: string;
  totalSales: number;
  transactionCount: number;
  averageTransaction: number;
  topSellingItem?: string;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  category: string;
}

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
  category?: string;
  basePrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  minStockLevel: number;
  trackStock?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  showInPOS?: boolean;
  sortOrder?: number;
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
  recipeId?: string;
  servingSize?: number;
  isProduced?: boolean;
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

export interface RecipeIngredient {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  servings: number;
  ingredients: RecipeIngredient[];
  totalCost: number;
  costPerServing: number;
  profitMarginPercentage?: number;
  instructions?: string;
  prepTime?: number;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceType = 'purchase' | 'sale';
export type InvoiceStatus = 'draft' | 'completed' | 'cancelled';

export interface InvoiceItem {
  id: string;
  productId?: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  branchId: string;
  supplierName?: string;
  customerName?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  autoUpdateStock: boolean;
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
