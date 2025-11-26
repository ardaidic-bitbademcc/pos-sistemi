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

// Helper functions using Vercel API (which connects to Supabase via Prisma)
async function getKV<T>(key: string): Promise<T | null> {
  try {
    const response = await fetch(`/api/kv/${key}`);
    if (response.ok) {
      const data = await response.json();
      return data.value;
    }
  } catch (err) {
    console.warn('API read failed:', err);
  }
  
  return null;
}

async function setKV<T>(key: string, value: T): Promise<void> {
  try {
    const response = await fetch(`/api/kv/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API write failed: ${JSON.stringify(error)}`);
    }
  } catch (err) {
    console.error('API write failed:', err);
    throw err;
  }
}

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

    // Save migration status
    const migrationResult = {
      migrated: true,
      migratedTables,
      timestamp,
    };

    await setKV('data-migration-completed', migrationResult);

    // Verify it was saved
    console.log('Migration completed and status saved:', migrationResult);

    return migrationResult;
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function migrateEmployees() {
  const employees = await getKV<Employee[]>('employees');
  if (!employees || employees.length === 0) return;

  const migratedEmployees = employees.map((emp) => ({
    ...emp,
    adminId: emp.adminId || DEFAULT_ADMIN_ID,
    branchId: emp.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('employees', migratedEmployees);
}

async function migrateProducts() {
  const products = await getKV<Product[]>('products');
  if (!products || products.length === 0) return;

  const migratedProducts = products.map((prod) => ({
    ...prod,
    adminId: prod.adminId || DEFAULT_ADMIN_ID,
    branchId: prod.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('products', migratedProducts);
}

async function migrateMenuItems() {
  const menuItems = await getKV<MenuItem[]>('menuItems');
  if (!menuItems || menuItems.length === 0) return;

  const migratedMenuItems = menuItems.map((item) => ({
    ...item,
    adminId: item.adminId || DEFAULT_ADMIN_ID,
    branchId: item.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('menuItems', migratedMenuItems);
}

async function migrateCategories() {
  const categories = await getKV<Category[]>('categories');
  if (!categories || categories.length === 0) return;

  const migratedCategories = categories.map((cat) => ({
    ...cat,
    adminId: cat.adminId || DEFAULT_ADMIN_ID,
    branchId: cat.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('categories', migratedCategories);
}

async function migrateBranches() {
  const branches = await getKV<Branch[]>('branches');
  if (!branches || branches.length === 0) return;

  const migratedBranches = branches.map((branch) => ({
    ...branch,
    adminId: branch.adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('branches', migratedBranches);
}

async function migrateSales() {
  const sales = await getKV<Sale[]>('sales');
  if (!sales || sales.length === 0) return;

  const migratedSales = sales.map((sale) => ({
    ...sale,
    branchId: sale.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('sales', migratedSales);
}

async function migrateSalaryCalculations() {
  const salaries = await getKV<SalaryCalculation[]>('salaryCalculations');
  if (!salaries || salaries.length === 0) return;

  const migratedSalaries = salaries.map((salary) => ({
    ...salary,
    adminId: salary.adminId || DEFAULT_ADMIN_ID,
    branchId: salary.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('salaryCalculations', migratedSalaries);
}

async function migrateTasks() {
  const tasks = await getKV<Task[]>('tasks');
  if (!tasks || tasks.length === 0) return;

  const migratedTasks = tasks.map((task) => ({
    ...task,
    branchId: task.branchId || DEFAULT_BRANCH_ID,
  }));

  await setKV('tasks', migratedTasks);
}

async function migrateCustomerAccounts() {
  const accounts = await getKV<CustomerAccount[]>('customer-accounts');
  if (!accounts || accounts.length === 0) return;

  const migratedAccounts = accounts.map((account) => ({
    ...account,
    branchId: (account as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (account as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('customer-accounts', migratedAccounts);
}

async function migrateB2BSuppliers() {
  const suppliers = await getKV<B2BSupplier[]>('b2b-suppliers');
  if (!suppliers || suppliers.length === 0) return;

  const migratedSuppliers = suppliers.map((supplier) => ({
    ...supplier,
    adminId: (supplier as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('b2b-suppliers', migratedSuppliers);
}

async function migrateB2BProducts() {
  const products = await getKV<B2BProduct[]>('b2b-products');
  if (!products || products.length === 0) return;

  const migratedProducts = products.map((product) => ({
    ...product,
    adminId: (product as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('b2b-products', migratedProducts);
}

async function migrateB2BOrders() {
  const orders = await getKV<B2BOrder[]>('b2b-orders');
  if (!orders || orders.length === 0) return;

  const migratedOrders = orders.map((order) => ({
    ...order,
    branchId: (order as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (order as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('b2b-orders', migratedOrders);
}

async function migrateSampleRequests() {
  const requests = await getKV<SampleRequest[]>('b2b-sample-requests');
  if (!requests || requests.length === 0) return;

  const migratedRequests = requests.map((request) => ({
    ...request,
    branchId: (request as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (request as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('b2b-sample-requests', migratedRequests);
}

async function migrateInvoices() {
  const invoices = await getKV<Invoice[]>('invoices');
  if (!invoices || invoices.length === 0) return;

  const migratedInvoices = invoices.map((invoice) => ({
    ...invoice,
    branchId: invoice.branchId || DEFAULT_BRANCH_ID,
    adminId: (invoice as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('invoices', migratedInvoices);
}

async function migrateExpenses() {
  const expenses = await getKV<Expense[]>('expenses');
  if (!expenses || expenses.length === 0) return;

  const migratedExpenses = expenses.map((expense) => ({
    ...expense,
    branchId: expense.branchId || DEFAULT_BRANCH_ID,
    adminId: (expense as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('expenses', migratedExpenses);
}

async function migrateCashTransactions() {
  const transactions = await getKV<CashTransaction[]>('cash-transactions');
  if (!transactions || transactions.length === 0) return;

  const migratedTransactions = transactions.map((transaction) => ({
    ...transaction,
    branchId: transaction.branchId || DEFAULT_BRANCH_ID,
    adminId: (transaction as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('cash-transactions', migratedTransactions);
}

async function migrateRecipes() {
  const recipes = await getKV<Recipe[]>('recipes');
  if (!recipes || recipes.length === 0) return;

  const migratedRecipes = recipes.map((recipe) => ({
    ...recipe,
    branchId: (recipe as any).branchId || DEFAULT_BRANCH_ID,
    adminId: (recipe as any).adminId || DEFAULT_ADMIN_ID,
  }));

  await setKV('recipes', migratedRecipes);
}

export async function checkMigrationStatus(): Promise<MigrationResult | null> {
  try {
    const result = await getKV<MigrationResult>('data-migration-completed');
    console.log('Migration status check:', result);
    return result || null;
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return null;
  }
}

export async function resetMigration(): Promise<void> {
  try {
    await fetch('/api/kv/data-migration-completed', {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Migration reset failed:', err);
    throw err;
  }
}
