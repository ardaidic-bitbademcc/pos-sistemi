export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  userName?: string;
  branchId?: string;
  branchName?: string;
  sessionId?: string;
}

export interface PaymentLogData {
  paymentMethod: string;
  amount: number;
  saleNumber?: string;
  saleId?: string;
  tableNumber?: string;
  customerAccount?: string;
  splitPayments?: Array<{ method: string; amount: number }>;
  cashReceived?: number;
  changeGiven?: number;
  discount?: number;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export interface TransactionLogData {
  transactionId: string;
  transactionType: 'sale' | 'refund' | 'payment' | 'transfer' | 'adjustment';
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  customerAccountId?: string;
  customerName?: string;
  paymentMethod?: string;
  notes?: string;
}

export class Logger {
  private static readonly MAX_LOGS = 1000;
  private static readonly STORAGE_KEY = 'systemLogs';

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private static async getLogs(): Promise<LogEntry[]> {
    try {
      const logsStr = localStorage.getItem(this.STORAGE_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  private static async saveLogs(logs: LogEntry[]): Promise<void> {
    try {
      const trimmedLogs = logs.slice(-this.MAX_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  private static async addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logs = await this.getLogs();
    const newEntry: LogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    
    logs.push(newEntry);
    await this.saveLogs(logs);

    const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]`;
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data);
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data);
        break;
      case 'success':
        console.log(prefix, entry.message, entry.data);
        break;
    }
  }

  static debug(category: string, message: string, data?: any, context?: Partial<LogEntry>): void {
    this.addLog({ level: 'debug', category, message, data, ...context });
  }

  static info(category: string, message: string, data?: any, context?: Partial<LogEntry>): void {
    this.addLog({ level: 'info', category, message, data, ...context });
  }

  static warn(category: string, message: string, data?: any, context?: Partial<LogEntry>): void {
    this.addLog({ level: 'warn', category, message, data, ...context });
  }

  static error(category: string, message: string, data?: any, context?: Partial<LogEntry>): void {
    this.addLog({ level: 'error', category, message, data, ...context });
  }

  static success(category: string, message: string, data?: any, context?: Partial<LogEntry>): void {
    this.addLog({ level: 'success', category, message, data, ...context });
  }

  static async getAllLogs(): Promise<LogEntry[]> {
    return this.getLogs();
  }

  static async clearLogs(): Promise<void> {
    await this.saveLogs([]);
  }

  static async getLogsByCategory(category: string): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.category === category);
  }

  static async getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.level === level);
  }

  static async getLogsByTimeRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  static async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  static async getPaymentLogs(): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => 
      log.category === 'payment' || 
      log.category === 'transaction' ||
      log.category === 'cash-register'
    );
  }

  static logPayment(
    message: string,
    paymentData: PaymentLogData,
    context?: Partial<LogEntry>
  ): void {
    this.info('payment', message, paymentData, context);
  }

  static logTransaction(
    message: string,
    transactionData: TransactionLogData,
    context?: Partial<LogEntry>
  ): void {
    this.info('transaction', message, transactionData, context);
  }

  static logPaymentError(
    message: string,
    errorData: any,
    context?: Partial<LogEntry>
  ): void {
    this.error('payment', message, errorData, context);
  }

  static logTransactionError(
    message: string,
    errorData: any,
    context?: Partial<LogEntry>
  ): void {
    this.error('transaction', message, errorData, context);
  }
}
