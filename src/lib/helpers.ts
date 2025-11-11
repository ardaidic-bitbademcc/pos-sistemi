export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSaleNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SAL-${year}${month}${day}-${random}`;
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

export function calculateHoursWorked(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(0, diffHours - (breakMinutes / 60));
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

export function calculateRecipeTotalCost(ingredients: Array<{ quantity: number; costPerUnit: number }>): number {
  return ingredients.reduce((total, ing) => total + (ing.quantity * ing.costPerUnit), 0);
}

export function calculateCostPerServing(totalCost: number, servings: number): number {
  return servings > 0 ? totalCost / servings : 0;
}

export function calculateProfitMargin(sellingPrice: number, costPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

export function generateAccountNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `CA-${year}${month}-${random}`;
}

export function getBaseCategories() {
  return [
    {
      id: 'beverages',
      name: 'İçecek',
      description: 'Sıcak ve soğuk içecekler',
      showInPOS: true,
      sortOrder: 0,
    },
    {
      id: 'food',
      name: 'Yiyecek',
      description: 'Ana yemekler ve atıştırmalıklar',
      showInPOS: true,
      sortOrder: 1,
    },
    {
      id: 'dessert',
      name: 'Tatlı',
      description: 'Tatlılar ve unlu mamuller',
      showInPOS: true,
      sortOrder: 2,
    },
    {
      id: 'coffee',
      name: 'Kahve',
      description: 'Kahve çeşitleri',
      showInPOS: true,
      sortOrder: 3,
    },
    {
      id: 'ingredients',
      name: 'Malzeme',
      description: 'Ham maddeler ve malzemeler',
      showInPOS: false,
      sortOrder: 4,
    },
  ];
}
