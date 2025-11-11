import type {
  Employee,
  Product,
  MenuItem,
  Category,
  Branch,
  Sale,
  SalaryCalculation,
  Task,
  CustomerAccount,
  B2BSupplier,
  B2BProduct,
  B2BOrder,
  SampleRequest,
  Invoice,
  Expense,
  CashTransaction,
  Recipe,
} from './types';

const DEFAULT_ADMIN_ID = 'admin-1';
const DEFAULT_BRANCH_ID = 'branch-1';

export interface MigrationResult {
  migrated: boolean;
  migratedTables: string[];
  timestamp: string;
}

export async function migrateAllData(): Promise<MigrationResult> {
  const migratedTables: string[] = [];
  const timestamp = new Date().toISOString();

  try {
    await migrateEmployees();
    migratedTables.push('employees');

    await migrateProducts();
    migratedTables.push('products');

    await migrateMenuItems();
    migratedTables.push('menuItems');

    await migrateCategories();
    migratedTables.push('categories');

    await migrateBranches();
    migratedTables.push('branches');

    await migrateSales();
    migratedTables.push('sales');

    await migrateSalaryCalculations();
    migratedTables.push('salaryCalculations');

    await migrateTasks();
    migratedTables.push('tasks');

    await migrateCustomerAccounts();
    migratedTables.push('customerAccounts');

    await migrateB2BSuppliers();
    migratedTables.push('b2b-suppliers');

    await migrateB2BProducts();
    migratedTables.push('b2b-products');

    await migrateB2BOrders();
    migratedTables.push('b2b-orders');

    await migrateSampleRequests();
    migratedTables.push('b2b-sample-requests');

    await migrateInvoices();
    migratedTables.push('invoices');

    await migrateExpenses();
    migratedTables.push('expenses');

    await migrateCashTransactions();
    migratedTables.push('cash-transactions');

    await migrateRecipes();
    migratedTables.push('recipes');

    await window.spark.kv.set('data-migration-completed', {
      migrated: true,
      migratedTables,
      timestamp,
    });

    return {
      migrated: true,
      migratedTables,
      timestamp,
    };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function migrateEmployees() {
  const employees = await window.spark.kv.get<Employee[]>('employees');
  if (!employees || employees.length === 0) return;

  const migratedEmployees = employees.map((emp) => ({
    ...emp,
    adminId: emp.adminId || DEFAULT_ADMIN_ID,
    branchId: emp.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('employees', migratedEmployees);
}

async function migrateProducts() {
  const products = await window.spark.kv.get<Product[]>('products');
  if (!products || products.length === 0) return;

  const migratedProducts = products.map((prod) => ({
    ...prod,
    adminId: prod.adminId || DEFAULT_ADMIN_ID,
    branchId: prod.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('products', migratedProducts);
}

async function migrateMenuItems() {
  const menuItems = await window.spark.kv.get<MenuItem[]>('menuItems');
  if (!menuItems || menuItems.length === 0) return;

  const migratedMenuItems = menuItems.map((item) => ({
    ...item,
    adminId: item.adminId || DEFAULT_ADMIN_ID,
    branchId: item.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('menuItems', migratedMenuItems);
}

async function migrateCategories() {
  const categories = await window.spark.kv.get<Category[]>('categories');
  if (!categories || categories.length === 0) return;

  const migratedCategories = categories.map((cat) => ({
    ...cat,
    adminId: cat.adminId || DEFAULT_ADMIN_ID,
    branchId: cat.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('categories', migratedCategories);
}

async function migrateBranches() {
  const branches = await window.spark.kv.get<Branch[]>('branches');
  if (!branches || branches.length === 0) return;

  const migratedBranches = branches.map((branch) => ({
    ...branch,
    adminId: branch.adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('branches', migratedBranches);
}

async function migrateSales() {
  const sales = await window.spark.kv.get<Sale[]>('sales');
  if (!sales || sales.length === 0) return;

  const migratedSales = sales.map((sale) => ({
    ...sale,
    branchId: sale.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('sales', migratedSales);
}

async function migrateSalaryCalculations() {
  const salaries = await window.spark.kv.get<SalaryCalculation[]>('salaryCalculations');
  if (!salaries || salaries.length === 0) return;

  const migratedSalaries = salaries.map((salary) => ({
    ...salary,
    adminId: salary.adminId || DEFAULT_ADMIN_ID,
    branchId: salary.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('salaryCalculations', migratedSalaries);
}

async function migrateTasks() {
  const tasks = await window.spark.kv.get<Task[]>('tasks');
  if (!tasks || tasks.length === 0) return;

  const migratedTasks = tasks.map((task) => ({
    ...task,
    branchId: task.branchId || DEFAULT_BRANCH_ID,
  }));

  await window.spark.kv.set('tasks', migratedTasks);
}

async function migrateCustomerAccounts() {
  const accounts = await window.spark.kv.get<CustomerAccount[]>('customer-accounts');
  if (!accounts || accounts.length === 0) return;

  const migratedAccounts = accounts.map((account) => ({
    ...account,
    branchId: (account as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (account as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('customer-accounts', migratedAccounts);
}

async function migrateB2BSuppliers() {
  const suppliers = await window.spark.kv.get<B2BSupplier[]>('b2b-suppliers');
  if (!suppliers || suppliers.length === 0) return;

  const migratedSuppliers = suppliers.map((supplier) => ({
    ...supplier,
    adminId: (supplier as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('b2b-suppliers', migratedSuppliers);
}

async function migrateB2BProducts() {
  const products = await window.spark.kv.get<B2BProduct[]>('b2b-products');
  if (!products || products.length === 0) return;

  const migratedProducts = products.map((product) => ({
    ...product,
    adminId: (product as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('b2b-products', migratedProducts);
}

async function migrateB2BOrders() {
  const orders = await window.spark.kv.get<B2BOrder[]>('b2b-orders');
  if (!orders || orders.length === 0) return;

  const migratedOrders = orders.map((order) => ({
    ...order,
    branchId: (order as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (order as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('b2b-orders', migratedOrders);
}

async function migrateSampleRequests() {
  const requests = await window.spark.kv.get<SampleRequest[]>('b2b-sample-requests');
  if (!requests || requests.length === 0) return;

  const migratedRequests = requests.map((request) => ({
    ...request,
    branchId: (request as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (request as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('b2b-sample-requests', migratedRequests);
}

async function migrateInvoices() {
  const invoices = await window.spark.kv.get<Invoice[]>('invoices');
  if (!invoices || invoices.length === 0) return;

  const migratedInvoices = invoices.map((invoice) => ({
    ...invoice,
    branchId: invoice.branchId || DEFAULT_BRANCH_ID,
    adminId: (invoice as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('invoices', migratedInvoices);
}

async function migrateExpenses() {
  const expenses = await window.spark.kv.get<Expense[]>('expenses');
  if (!expenses || expenses.length === 0) return;

  const migratedExpenses = expenses.map((expense) => ({
    ...expense,
    branchId: expense.branchId || DEFAULT_BRANCH_ID,
    adminId: (expense as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('expenses', migratedExpenses);
}

async function migrateCashTransactions() {
  const transactions = await window.spark.kv.get<CashTransaction[]>('cash-transactions');
  if (!transactions || transactions.length === 0) return;

  const migratedTransactions = transactions.map((transaction) => ({
    ...transaction,
    branchId: transaction.branchId || DEFAULT_BRANCH_ID,
    adminId: (transaction as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('cash-transactions', migratedTransactions);
}

async function migrateRecipes() {
  const recipes = await window.spark.kv.get<Recipe[]>('recipes');
  if (!recipes || recipes.length === 0) return;

  const migratedRecipes = recipes.map((recipe) => ({
    ...recipe,
    branchId: (recipe as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (recipe as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await window.spark.kv.set('recipes', migratedRecipes);
}

export async function checkMigrationStatus(): Promise<MigrationResult | null> {
  const result = await window.spark.kv.get<MigrationResult>('data-migration-completed');
  return result || null;
}

export async function resetMigration(): Promise<void> {
  await window.spark.kv.delete('data-migration-completed');
}
