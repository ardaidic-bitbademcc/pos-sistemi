export type UserRole = 'owner' | 'manager' | 'cashier' | 'chef' | 'staff' | 'waiter';

export type ModulePermission = 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports' | 'tasks';

export interface RolePermissions {
  role: UserRole;
  permissions: ModulePermission[];
  canViewFinancials: boolean;
  canEditPrices: boolean;
  canManageUsers: boolean;
  canApprovePayments: boolean;
  canViewCashRegister: boolean;
  canAddCash: boolean;
  canWithdrawCash: boolean;
  canCloseCashRegister: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canViewAllTasks: boolean;
  canViewTaskStatus: boolean;
  canRateTask: boolean;
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
  email?: string;
  managerName?: string;
  isActive: boolean;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  choices: ProductOptionChoice[];
  required: boolean;
  multiSelect: boolean;
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  priceModifier: number;
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
  hasActiveCampaign?: boolean;
  campaignDetails?: {
    originalPrice: number;
    discountPercentage: number;
    startDate: string;
    endDate?: string;
    reason?: string;
  };
  hasOptions?: boolean;
  options?: ProductOption[];
  branchId?: string;
  adminId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  showInPOS?: boolean;
  sortOrder?: number;
  branchId?: string;
  adminId?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'transfer' | 'multinet';
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
  paidAmount?: number;
  remainingAmount?: number;
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
  selectedOptions?: {
    optionName: string;
    choiceName: string;
    priceModifier: number;
  }[];
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
  joinDate?: string;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  workDays?: number;
  mealAllowance?: number;
  standardHours?: number;
  overtimeHours?: number;
  branchId?: string;
  adminId?: string;
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
  dailyMealAllowance?: number;
  includeMealAllowance?: boolean;
}

export interface TableSection {
  id: string;
  branchId: string;
  adminId?: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Table {
  id: string;
  branchId: string;
  adminId?: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentSaleId?: string;
  section?: string;
  sectionId?: string;
  firstOrderTime?: string;
  lastOrderTime?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  layoutX?: number;
  layoutY?: number;
  layoutWidth?: number;
  layoutHeight?: number;
  layoutShape?: 'square' | 'rectangle' | 'circle';
}

export interface TableOrder {
  id: string;
  tableId: string;
  saleId: string;
  openedAt: string;
  closedAt?: string;
  customersCount?: number;
  notes?: string;
}

export interface CashRegister {
  id: string;
  branchId: string;
  date: string;
  openingBalance: number;
  currentBalance: number;
  totalCashSales: number;
  totalCardSales: number;
  totalMobileSales: number;
  totalTransferSales: number;
  totalMultinetSales: number;
  totalSales: number;
  lastUpdated: string;
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
  hasActiveCampaign?: boolean;
  campaignDetails?: {
    originalPrice: number;
    discountPercentage: number;
    startDate: string;
    endDate?: string;
    reason?: string;
  };
  hasOptions?: boolean;
  options?: ProductOption[];
  branchId?: string;
  adminId?: string;
  createdAt?: string;
}

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  borderRadius: string;
  fontFamily: string;
  isDark?: boolean;
}

export interface QRMenuTheme {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  showImages: boolean;
  showDescriptions: boolean;
  layout: 'grid' | 'list';
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
  branchId?: string;
  adminId?: string;
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
  adminId?: string;
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
  adminId?: string;
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

export type CashTransactionType = 'in' | 'out' | 'opening' | 'closing';

export interface CashTransaction {
  id: string;
  branchId: string;
  adminId?: string;
  type: CashTransactionType;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface CashRegisterStatus {
  id: string;
  branchId: string;
  openingBalance: number;
  currentBalance: number;
  expectedBalance: number;
  totalIn: number;
  totalOut: number;
  totalSales: number;
  transactions: CashTransaction[];
  openedAt: string;
  closedAt?: string;
  isOpen: boolean;
}

export interface UserCredential {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  employeeId?: string;
  isActive: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  rating?: number;
  ratingComment?: string;
  ratedBy?: string;
  ratedByName?: string;
  ratedAt?: string;
  recurrence: TaskRecurrence;
  lastRecurrenceDate?: string;
  branchId: string;
  category?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export type B2BUserType = 'supplier' | 'customer';
export type OrderStatus = 'pending' | 'approved' | 'cancelled' | 'preparing' | 'shipped' | 'delivered';
export type SampleRequestStatus = 'pending' | 'approved' | 'rejected' | 'sent';
export type ShippingMethod = 'free' | 'buyer_pays';

export type SupplierPanelStatus = 'active' | 'paused' | 'vacation';

export interface B2BSupplier {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  taxNumber?: string;
  rating?: number;
  totalProducts: number;
  isActive: boolean;
  createdAt: string;
  logo?: string;
  panelStatus?: SupplierPanelStatus;
  pausedAt?: string;
  pausedUntil?: string;
  pauseReason?: string;
  adminId?: string;
  isDemo?: boolean;
}

export interface SupplierAuthSession {
  supplierId: string;
  supplierName: string;
  loginTime: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  minOrderQuantity: number;
  isActive: boolean;
}

export interface B2BProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  minOrderQuantity: number;
  unit: string;
  imageUrl?: string;
  canProvideSample: boolean;
  requiresDesign: boolean;
  shippingMethod: ShippingMethod;
  shippingDetails?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  specifications?: Record<string, string>;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  adminId?: string;
}

export interface SampleRequest {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  supplierId: string;
  supplierName: string;
  deliveryAddress: string;
  status: SampleRequestStatus;
  requestDate: string;
  responseDate?: string;
  rejectionReason?: string;
  notes?: string;
  branchId?: string;
  adminId?: string;
}

export interface B2BOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  customerId: string;
  customerName: string;
  items: B2BOrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  designFiles?: DesignFile[];
  mockupUrl?: string;
  mockupGeneratedAt?: string;
  shippingTrackingNumber?: string;
  shippingCompany?: string;
  deliveryAddress: string;
  orderDate: string;
  approvedDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  cancelledDate?: string;
  cancellationReason?: string;
  notes?: string;
  statusHistory: OrderStatusHistory[];
  branchId?: string;
  adminId?: string;
}

export interface B2BOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  requiresDesign: boolean;
  variantId?: string;
  variantName?: string;
}

export interface DesignFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export interface MockupGenerationRequest {
  orderId: string;
  productId: string;
  designFileUrl: string;
  productImageUrl: string;
}

export type CustomerAccountType = 'individual' | 'corporate';
export type CustomerAccountStatus = 'active' | 'suspended' | 'closed';

export interface CustomerAccount {
  id: string;
  accountNumber: string;
  customerName: string;
  accountType: CustomerAccountType;
  taxNumber?: string;
  identityNumber?: string;
  email?: string;
  phone: string;
  address?: string;
  creditLimit: number;
  currentBalance: number;
  totalDebt: number;
  totalPaid: number;
  status: CustomerAccountStatus;
  createdAt: string;
  isEmployee?: boolean;
  employeeId?: string;
  notes?: string;
  branchId?: string;
  adminId?: string;
}

export interface CustomerTransaction {
  id: string;
  customerAccountId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  saleId?: string;
  saleNumber?: string;
  paymentMethod?: PaymentMethod;
  date: string;
  createdBy: string;
  createdByName: string;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
}

export interface Admin {
  id: string;
  email: string;
  password: string;
  businessName: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthSession {
  userId?: string;
  adminId: string;
  branchId: string;
  userRole: UserRole;
  userName: string;
  loginTime: string;
}
