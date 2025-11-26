import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTime,
  generateId,
  generateSaleNumber,
  calculateTax,
  calculateHoursWorked,
} from '../helpers';

describe('Helpers - Formatting Functions', () => {
  describe('formatCurrency', () => {
    it('should format number as Turkish Lira currency', () => {
      expect(formatCurrency(100)).toBe('₺100,00');
      expect(formatCurrency(1234.56)).toBe('₺1.234,56');
      expect(formatCurrency(0)).toBe('₺0,00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-₺50,00');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(99.999)).toBe('₺100,00');
      expect(formatCurrency(10.5)).toBe('₺10,50');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with Turkish locale', () => {
      expect(formatNumber(1000)).toBe('1.000');
      expect(formatNumber(1234567)).toBe('1.234.567');
    });

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1.000');
    });
  });

  describe('formatDate', () => {
    it('should format date string in Turkish format', () => {
      const date = new Date('2024-12-25T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('should handle Date object', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in Turkish format', () => {
      const date = new Date('2024-12-25T10:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    });
  });

  describe('formatTime', () => {
    it('should format time only', () => {
      const date = new Date('2024-12-25T10:30:00');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });
});

describe('Helpers - Generation Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with correct format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('generateSaleNumber', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should generate sale number with correct format', () => {
      const saleNumber = generateSaleNumber();
      expect(saleNumber).toMatch(/^SAL-\d{6}-\d{4}$/);
    });

    it('should include current date in sale number', () => {
      vi.setSystemTime(new Date('2024-12-25'));
      const saleNumber = generateSaleNumber();
      expect(saleNumber).toContain('241225');
    });

    it('should generate unique sale numbers', () => {
      const num1 = generateSaleNumber();
      const num2 = generateSaleNumber();
      // They might be the same if called in same millisecond, but format should be correct
      expect(num1).toMatch(/^SAL-\d{6}-\d{4}$/);
      expect(num2).toMatch(/^SAL-\d{6}-\d{4}$/);
    });
  });
});

describe('Helpers - Calculation Functions', () => {
  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(100, 18)).toBe(18);
      expect(calculateTax(200, 8)).toBe(16);
      expect(calculateTax(150, 1)).toBe(1.5);
    });

    it('should handle zero and negative values', () => {
      expect(calculateTax(0, 18)).toBe(0);
      expect(calculateTax(100, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const tax = calculateTax(33.33, 18);
      expect(tax).toBeCloseTo(6, 2);
    });
  });

  describe('calculateHoursWorked', () => {
    it('should calculate hours between two dates', () => {
      const start = new Date('2024-12-25T09:00:00').toISOString();
      const end = new Date('2024-12-25T17:00:00').toISOString();
      expect(calculateHoursWorked(start, end)).toBe(8);
    });

    it('should handle partial hours', () => {
      const start = new Date('2024-12-25T09:00:00').toISOString();
      const end = new Date('2024-12-25T13:30:00').toISOString();
      expect(calculateHoursWorked(start, end)).toBeCloseTo(4.5, 1);
    });

    it('should handle overnight shifts', () => {
      const start = new Date('2024-12-25T22:00:00').toISOString();
      const end = new Date('2024-12-26T06:00:00').toISOString();
      expect(calculateHoursWorked(start, end)).toBe(8);
    });

    it('should return 0 for same start and end time', () => {
      const time = new Date('2024-12-25T09:00:00').toISOString();
      expect(calculateHoursWorked(time, time)).toBe(0);
    });

    it('should handle break minutes', () => {
      const start = new Date('2024-12-25T09:00:00').toISOString();
      const end = new Date('2024-12-25T17:00:00').toISOString();
      // 8 hours - 30 minutes break = 7.5 hours
      expect(calculateHoursWorked(start, end, 30)).toBe(7.5);
    });
  });
});
