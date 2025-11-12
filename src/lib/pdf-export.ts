import type { CustomerAccount, CustomerTransaction } from './types';
import { formatCurrency, formatDateTime } from './helpers';

interface PDFStyles {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  fontSize: {
    title: number;
    header: number;
    body: number;
    small: number;
  };
  lineHeight: number;
  colors: {
    primary: string;
    text: string;
    border: string;
    background: string;
    danger: string;
    success: string;
  };
}

const styles: PDFStyles = {
  pageWidth: 595,
  pageHeight: 842,
  margin: 40,
  fontSize: {
    title: 18,
    header: 14,
    body: 10,
    small: 8,
  },
  lineHeight: 1.4,
  colors: {
    primary: '#4338ca',
    text: '#1a1a1a',
    border: '#e5e7eb',
    background: '#f9fafb',
    danger: '#dc2626',
    success: '#16a34a',
  },
};

export async function exportAccountStatementToPDF(
  account: CustomerAccount,
  transactions: CustomerTransaction[]
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = styles.pageWidth;
  canvas.height = styles.pageHeight;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let yPos = styles.margin;
  const contentWidth = canvas.width - 2 * styles.margin;

  ctx.fillStyle = styles.colors.primary;
  ctx.font = `bold ${styles.fontSize.title}px Inter, sans-serif`;
  ctx.fillText('CARİ HESAP EKSTRESİ', styles.margin, yPos);
  yPos += styles.fontSize.title * 1.5;

  ctx.strokeStyle = styles.colors.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(styles.margin, yPos);
  ctx.lineTo(canvas.width - styles.margin, yPos);
  ctx.stroke();
  yPos += 20;

  ctx.fillStyle = styles.colors.text;
  ctx.font = `${styles.fontSize.body}px Inter, sans-serif`;
  
  const accountInfo = [
    [`Hesap No:`, account.accountNumber],
    [`Müşteri:`, account.customerName],
    [`Hesap Tipi:`, account.accountType === 'corporate' ? 'Tüzel' : 'Şahıs'],
    [`Telefon:`, account.phone],
  ];
  
  if (account.email) accountInfo.push([`E-posta:`, account.email]);
  if (account.address) accountInfo.push([`Adres:`, account.address]);
  
  accountInfo.forEach(([label, value]) => {
    ctx!.fillStyle = styles.colors.text;
    ctx!.font = `${styles.fontSize.body}px Inter, sans-serif`;
    ctx!.fillText(label, styles.margin, yPos);
    
    ctx!.font = `bold ${styles.fontSize.body}px Inter, sans-serif`;
    ctx!.fillText(value, styles.margin + 100, yPos);
    yPos += styles.fontSize.body * styles.lineHeight + 4;
  });

  yPos += 10;

  ctx.fillStyle = styles.colors.background;
  ctx.fillRect(styles.margin, yPos, contentWidth, 80);
  
  ctx.strokeStyle = styles.colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(styles.margin, yPos, contentWidth, 80);
  yPos += 15;

  const financials = [
    ['Harcama Limiti', formatCurrency(account.creditLimit), styles.colors.text],
    ['Mevcut Borç', formatCurrency(account.currentBalance), styles.colors.danger],
    ['Toplam Harcama', formatCurrency(account.totalDebt), styles.colors.text],
    ['Toplam Ödeme', formatCurrency(account.totalPaid), styles.colors.success],
  ];

  const colWidth = contentWidth / 4;
  financials.forEach(([label, value, color], index) => {
    const xPos = styles.margin + index * colWidth + 10;
    
    ctx!.fillStyle = styles.colors.text;
    ctx!.font = `${styles.fontSize.small}px Inter, sans-serif`;
    ctx!.fillText(label as string, xPos, yPos);
    
    ctx!.fillStyle = color as string;
    ctx!.font = `bold ${styles.fontSize.header}px Inter, sans-serif`;
    ctx!.fillText(value as string, xPos, yPos + 18);
  });
  
  yPos += 80;

  const pages: HTMLCanvasElement[] = [canvas];
  let currentCanvas = canvas;
  let currentCtx = ctx;
  let currentYPos = yPos;

  const checkNewPage = () => {
    if (currentYPos > canvas.height - styles.margin - 50) {
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      if (!newCtx) throw new Error('Could not get canvas context');
      
      newCanvas.width = styles.pageWidth;
      newCanvas.height = styles.pageHeight;
      
      newCtx.fillStyle = '#ffffff';
      newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      
      pages.push(newCanvas);
      currentCanvas = newCanvas;
      currentCtx = newCtx;
      currentYPos = styles.margin;
      
      return true;
    }
    return false;
  };

  currentYPos += 20;
  checkNewPage();

  currentCtx.fillStyle = styles.colors.background;
  currentCtx.fillRect(styles.margin, currentYPos, contentWidth, 25);
  
  currentCtx.fillStyle = styles.colors.text;
  currentCtx.font = `bold ${styles.fontSize.body}px Inter, sans-serif`;
  
  const headers = [
    { text: 'Tarih', x: styles.margin + 5, width: 85 },
    { text: 'İşlem', x: styles.margin + 95, width: 60 },
    { text: 'Tutar', x: styles.margin + 160, width: 70 },
    { text: 'Ödeme', x: styles.margin + 235, width: 60 },
    { text: 'Bakiye', x: styles.margin + 300, width: 70 },
    { text: 'Fiş No', x: styles.margin + 375, width: 60 },
  ];
  
  headers.forEach(header => {
    currentCtx.fillText(header.text, header.x, currentYPos + 16);
  });
  
  currentCtx.strokeStyle = styles.colors.border;
  currentCtx.lineWidth = 1;
  currentCtx.strokeRect(styles.margin, currentYPos, contentWidth, 25);
  currentYPos += 25;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedTransactions.forEach((transaction, index) => {
    checkNewPage();
    
    const rowHeight = 30;
    
    if (index % 2 === 0) {
      currentCtx.fillStyle = styles.colors.background;
      currentCtx.fillRect(styles.margin, currentYPos, contentWidth, rowHeight);
    }
    
    currentCtx.strokeStyle = styles.colors.border;
    currentCtx.lineWidth = 0.5;
    currentCtx.strokeRect(styles.margin, currentYPos, contentWidth, rowHeight);
    
    currentCtx.fillStyle = styles.colors.text;
    currentCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
    
    const date = formatDateTime(transaction.date);
    currentCtx.fillText(date, headers[0].x, currentYPos + 18);
    
    const type = transaction.type === 'debit' ? 'Borç' : 'Ödeme';
    currentCtx.fillText(type, headers[1].x, currentYPos + 18);
    
    const amount = transaction.type === 'debit' 
      ? `+${formatCurrency(transaction.amount)}`
      : `-${formatCurrency(transaction.amount)}`;
    currentCtx.fillStyle = transaction.type === 'debit' ? styles.colors.danger : styles.colors.success;
    currentCtx.font = `bold ${styles.fontSize.small}px Inter, sans-serif`;
    currentCtx.fillText(amount, headers[2].x, currentYPos + 18);
    
    currentCtx.fillStyle = styles.colors.text;
    currentCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
    
    const paymentMethod = transaction.paymentMethod 
      ? (transaction.paymentMethod === 'cash' ? 'Nakit' : 
         transaction.paymentMethod === 'card' ? 'Kart' : 
         transaction.paymentMethod === 'transfer' ? 'Havale' : 'Mobil')
      : '-';
    currentCtx.fillText(paymentMethod, headers[3].x, currentYPos + 18);
    
    const balance = formatCurrency(transaction.balanceAfter);
    currentCtx.fillText(balance, headers[4].x, currentYPos + 18);
    
    const saleNumber = transaction.saleNumber || '-';
    const truncatedSaleNumber = saleNumber.length > 8 ? saleNumber.substring(0, 8) + '...' : saleNumber;
    currentCtx.fillText(truncatedSaleNumber, headers[5].x, currentYPos + 18);
    
    currentYPos += rowHeight;
  });

  currentCtx.fillStyle = styles.colors.text;
  currentCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
  currentCtx.fillText(
    `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
    styles.margin,
    currentCanvas.height - 20
  );
  currentCtx.fillText(
    `Sayfa ${pages.length}`,
    currentCanvas.width - styles.margin - 50,
    currentCanvas.height - 20
  );

  const pdf = {
    pages: pages.map(p => p.toDataURL('image/png')),
  };

  const link = document.createElement('a');
  link.download = `cari-ekstre-${account.accountNumber}-${new Date().toISOString().split('T')[0]}.png`;
  link.href = pdf.pages[0];
  link.click();

  return pdf;
}

export async function exportAllAccountsToPDF(accounts: CustomerAccount[]) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = styles.pageWidth;
  canvas.height = styles.pageHeight;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let yPos = styles.margin;
  const contentWidth = canvas.width - 2 * styles.margin;

  ctx.fillStyle = styles.colors.primary;
  ctx.font = `bold ${styles.fontSize.title}px Inter, sans-serif`;
  ctx.fillText('CARİ HESAPLAR RAPORU', styles.margin, yPos);
  yPos += styles.fontSize.title * 1.5;

  ctx.strokeStyle = styles.colors.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(styles.margin, yPos);
  ctx.lineTo(canvas.width - styles.margin, yPos);
  ctx.stroke();
  yPos += 20;

  const totalCreditLimit = accounts.reduce((sum, a) => sum + a.creditLimit, 0);
  const totalDebt = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalPaid = accounts.reduce((sum, a) => sum + a.totalPaid, 0);

  ctx.fillStyle = styles.colors.background;
  ctx.fillRect(styles.margin, yPos, contentWidth, 70);
  ctx.strokeStyle = styles.colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(styles.margin, yPos, contentWidth, 70);
  yPos += 15;

  const summaryData = [
    ['Toplam Hesap', `${accounts.length}`, styles.colors.text],
    ['Toplam Limit', formatCurrency(totalCreditLimit), styles.colors.text],
    ['Toplam Borç', formatCurrency(totalDebt), styles.colors.danger],
    ['Toplam Ödeme', formatCurrency(totalPaid), styles.colors.success],
  ];

  const colWidth = contentWidth / 4;
  summaryData.forEach(([label, value, color], index) => {
    const xPos = styles.margin + index * colWidth + 10;
    
    ctx!.fillStyle = styles.colors.text;
    ctx!.font = `${styles.fontSize.small}px Inter, sans-serif`;
    ctx!.fillText(label as string, xPos, yPos);
    
    ctx!.fillStyle = color as string;
    ctx!.font = `bold ${styles.fontSize.header}px Inter, sans-serif`;
    ctx!.fillText(value as string, xPos, yPos + 18);
  });
  
  yPos += 70;

  const pages: HTMLCanvasElement[] = [canvas];
  let currentCanvas = canvas;
  let currentCtx = ctx;
  let currentYPos = yPos;

  const checkNewPage = () => {
    if (currentYPos > canvas.height - styles.margin - 50) {
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      if (!newCtx) throw new Error('Could not get canvas context');
      
      newCanvas.width = styles.pageWidth;
      newCanvas.height = styles.pageHeight;
      
      newCtx.fillStyle = '#ffffff';
      newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
      
      pages.push(newCanvas);
      currentCanvas = newCanvas;
      currentCtx = newCtx;
      currentYPos = styles.margin;
      
      return true;
    }
    return false;
  };

  currentYPos += 20;

  currentCtx.fillStyle = styles.colors.background;
  currentCtx.fillRect(styles.margin, currentYPos, contentWidth, 25);
  
  currentCtx.fillStyle = styles.colors.text;
  currentCtx.font = `bold ${styles.fontSize.body}px Inter, sans-serif`;
  
  const headers = [
    { text: 'Hesap No', x: styles.margin + 5 },
    { text: 'Müşteri', x: styles.margin + 85 },
    { text: 'Telefon', x: styles.margin + 210 },
    { text: 'Limit', x: styles.margin + 310 },
    { text: 'Borç', x: styles.margin + 395 },
    { text: 'Durum', x: styles.margin + 475 },
  ];
  
  headers.forEach(header => {
    currentCtx.fillText(header.text, header.x, currentYPos + 16);
  });
  
  currentCtx.strokeStyle = styles.colors.border;
  currentCtx.lineWidth = 1;
  currentCtx.strokeRect(styles.margin, currentYPos, contentWidth, 25);
  currentYPos += 25;

  accounts.forEach((account, index) => {
    checkNewPage();
    
    const rowHeight = 30;
    
    if (index % 2 === 0) {
      currentCtx.fillStyle = styles.colors.background;
      currentCtx.fillRect(styles.margin, currentYPos, contentWidth, rowHeight);
    }
    
    currentCtx.strokeStyle = styles.colors.border;
    currentCtx.lineWidth = 0.5;
    currentCtx.strokeRect(styles.margin, currentYPos, contentWidth, rowHeight);
    
    currentCtx.fillStyle = styles.colors.text;
    currentCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
    
    currentCtx.fillText(account.accountNumber, headers[0].x, currentYPos + 18);
    
    const truncatedName = account.customerName.length > 20 
      ? account.customerName.substring(0, 20) + '...' 
      : account.customerName;
    currentCtx.fillText(truncatedName, headers[1].x, currentYPos + 18);
    
    currentCtx.fillText(account.phone, headers[2].x, currentYPos + 18);
    
    currentCtx.fillText(formatCurrency(account.creditLimit), headers[3].x, currentYPos + 18);
    
    currentCtx.fillStyle = account.currentBalance > 0 ? styles.colors.danger : styles.colors.text;
    currentCtx.font = `bold ${styles.fontSize.small}px Inter, sans-serif`;
    currentCtx.fillText(formatCurrency(account.currentBalance), headers[4].x, currentYPos + 18);
    
    currentCtx.fillStyle = styles.colors.text;
    currentCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
    const status = account.status === 'active' ? 'Aktif' : account.status === 'suspended' ? 'Askıda' : 'Kapalı';
    currentCtx.fillText(status, headers[5].x, currentYPos + 18);
    
    currentYPos += rowHeight;
  });

  pages.forEach((page, index) => {
    const pageCtx = page.getContext('2d');
    if (!pageCtx) return;
    
    pageCtx.fillStyle = styles.colors.text;
    pageCtx.font = `${styles.fontSize.small}px Inter, sans-serif`;
    pageCtx.fillText(
      `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
      styles.margin,
      page.height - 20
    );
    pageCtx.fillText(
      `Sayfa ${index + 1} / ${pages.length}`,
      page.width - styles.margin - 70,
      page.height - 20
    );
  });

  const link = document.createElement('a');
  link.download = `cari-hesaplar-${new Date().toISOString().split('T')[0]}.png`;
  link.href = pages[0].toDataURL('image/png');
  link.click();
}
