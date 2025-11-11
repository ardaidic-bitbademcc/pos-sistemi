import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import type { Employee, CustomerAccount } from '@/lib/types';
import { generateId, generateAccountNumber } from '@/lib/helpers';

export function useAutoEmployeeAccounts() {
  const [employees] = useKV<Employee[]>('employees', []);
  const [accounts, setAccounts] = useKV<CustomerAccount[]>('customerAccounts', []);

  useEffect(() => {
    const checkAndCreateAccounts = async () => {
      if (!employees || employees.length === 0) return;

      const currentAccounts = accounts || [];
      const activeEmployees = employees.filter(e => e.isActive);
      const existingEmployeeAccounts = currentAccounts.filter(a => a.isEmployee);
      const existingEmployeeIds = new Set(existingEmployeeAccounts.map(a => a.employeeId));

      const newAccounts: CustomerAccount[] = [];

      activeEmployees.forEach(employee => {
        if (!existingEmployeeIds.has(employee.id)) {
          const newAccount: CustomerAccount = {
            id: generateId(),
            accountNumber: generateAccountNumber(),
            customerName: employee.fullName,
            accountType: 'individual',
            phone: employee.phone,
            email: employee.email || undefined,
            creditLimit: 5000,
            currentBalance: 0,
            totalDebt: 0,
            totalPaid: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            isEmployee: true,
            employeeId: employee.id,
            notes: `${employee.role} - Otomatik oluşturulan personel hesabı`,
          };
          newAccounts.push(newAccount);
        }
      });

      if (newAccounts.length > 0) {
        setAccounts((current) => [...(current || []), ...newAccounts]);
      }
    };

    checkAndCreateAccounts();
  }, [employees, accounts, setAccounts]);
}
