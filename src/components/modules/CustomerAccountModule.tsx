import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, PencilSimple, Trash, Eye, User, Buildings, Warning, CheckCircle, XCircle, CreditCard, Money, TrendUp, TrendDown, Receipt, Bank, DeviceMobile } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { CustomerAccount, CustomerTransaction, Employee } from '@/lib/types';
import { formatCurrency, formatDateTime, generateId, generateAccountNumber } from '@/lib/helpers';

interface CustomerAccountModuleProps {
  onBack: () => void;
}

export default function CustomerAccountModule({ onBack }: CustomerAccountModuleProps) {
  const [accounts, setAccounts] = useKV<CustomerAccount[]>('customerAccounts', []);
  const [transactions, setTransactions] = useKV<CustomerTransaction[]>('customerTransactions', []);
  const [employees] = useKV<Employee[]>('employees', []);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    customerName: '',
    accountType: 'individual' as 'individual' | 'corporate',
    taxNumber: '',
    identityNumber: '',
    email: '',
    phone: '',
    address: '',
    spendingLimit: 5000,
    notes: '',
  });

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredAccounts = (accounts || []).filter(account => {
    const matchesSearch = 
      account.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.phone.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const activeAccounts = (accounts || []).filter(a => a.status === 'active');
  const totalCreditLimit = activeAccounts.reduce((sum, a) => sum + a.creditLimit, 0);
  const totalDebt = activeAccounts.reduce((sum, a) => sum + a.totalDebt, 0);
  const totalAvailableCredit = activeAccounts.reduce((sum, a) => sum + (a.creditLimit - a.currentBalance), 0);

  const resetForm = () => {
    setFormData({
      customerName: '',
      accountType: 'individual',
      taxNumber: '',
      identityNumber: '',
      email: '',
      phone: '',
      address: '',
      spendingLimit: 5000,
      notes: '',
    });
  };

  const handleAddAccount = () => {
    if (!formData.customerName || !formData.phone) {
      toast.error('Müşteri adı ve telefon zorunludur');
      return;
    }

    if (formData.spendingLimit < 0) {
      toast.error('Harcama limiti sıfırdan küçük olamaz');
      return;
    }

    const newAccount: CustomerAccount = {
      id: generateId(),
      accountNumber: generateAccountNumber(),
      customerName: formData.customerName,
      accountType: formData.accountType,
      taxNumber: formData.taxNumber || undefined,
      identityNumber: formData.identityNumber || undefined,
      email: formData.email || undefined,
      phone: formData.phone,
      address: formData.address || undefined,
      creditLimit: formData.spendingLimit,
      currentBalance: 0,
      totalDebt: 0,
      totalPaid: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: formData.notes || undefined,
    };

    setAccounts((current) => [...(current || []), newAccount]);
    toast.success('Cari hesap başarıyla oluşturuldu');
    setShowAddDialog(false);
    resetForm();
  };

  const handleEditAccount = () => {
    if (!selectedAccount) return;

    if (!formData.customerName || !formData.phone) {
      toast.error('Müşteri adı ve telefon zorunludur');
      return;
    }

    if (formData.spendingLimit < 0) {
      toast.error('Harcama limiti sıfırdan küçük olamaz');
      return;
    }

    if (formData.spendingLimit < selectedAccount.currentBalance) {
      toast.error('Harcama limiti mevcut bakiyeden düşük olamaz');
      return;
    }

    setAccounts((current) =>
      (current || []).map((account) =>
        account.id === selectedAccount.id
          ? {
              ...account,
              customerName: formData.customerName,
              accountType: formData.accountType,
              taxNumber: formData.taxNumber || undefined,
              identityNumber: formData.identityNumber || undefined,
              email: formData.email || undefined,
              phone: formData.phone,
              address: formData.address || undefined,
              creditLimit: formData.spendingLimit,
              notes: formData.notes || undefined,
            }
          : account
      )
    );

    toast.success('Cari hesap güncellendi');
    setShowEditDialog(false);
    setSelectedAccount(null);
    resetForm();
  };

  const handleDeleteAccount = (account: CustomerAccount) => {
    if (account.currentBalance > 0) {
      toast.error('Borcu olan hesap silinemez');
      return;
    }

    if (account.isEmployee) {
      toast.error('Personel hesapları silinemez');
      return;
    }

    setAccounts((current) => (current || []).filter((a) => a.id !== account.id));
    toast.success('Cari hesap silindi');
  };

  const handleSuspendAccount = (account: CustomerAccount) => {
    setAccounts((current) =>
      (current || []).map((a) =>
        a.id === account.id ? { ...a, status: 'suspended' as const } : a
      )
    );
    toast.success('Hesap askıya alındı');
  };

  const handleActivateAccount = (account: CustomerAccount) => {
    setAccounts((current) =>
      (current || []).map((a) =>
        a.id === account.id ? { ...a, status: 'active' as const } : a
      )
    );
    toast.success('Hesap aktif edildi');
  };

  const handleMakePayment = () => {
    if (!selectedAccount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    const balanceBefore = selectedAccount.currentBalance;
    const balanceAfter = balanceBefore - amount;

    const transaction: CustomerTransaction = {
      id: generateId(),
      customerAccountId: selectedAccount.id,
      type: 'credit',
      amount: amount,
      description: 'Ödeme',
      paymentMethod: paymentMethod,
      date: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: 'Kullanıcı',
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      notes: paymentNotes || undefined,
    };

    setTransactions((current) => [...(current || []), transaction]);
    setAccounts((current) =>
      (current || []).map((account) =>
        account.id === selectedAccount.id
          ? {
              ...account,
              currentBalance: balanceAfter,
              totalPaid: account.totalPaid + amount,
            }
          : account
      )
    );

    toast.success(`${formatCurrency(amount)} ödeme alındı`);
    setShowPaymentDialog(false);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const openEditDialog = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setFormData({
      customerName: account.customerName,
      accountType: account.accountType,
      taxNumber: account.taxNumber || '',
      identityNumber: account.identityNumber || '',
      email: account.email || '',
      phone: account.phone,
      address: account.address || '',
      spendingLimit: account.creditLimit,
      notes: account.notes || '',
    });
    setShowEditDialog(true);
  };

  const openDetailDialog = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setShowDetailDialog(true);
  };

  const openPaymentDialog = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentDialog(true);
  };

  const getAccountTransactions = (accountId: string) => {
    return (transactions || [])
      .filter((t) => t.customerAccountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCreditUtilization = (account: CustomerAccount) => {
    if (account.creditLimit === 0) return 0;
    return (account.currentBalance / account.creditLimit) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'secondary';
      case 'closed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="h-9 w-9 sm:h-10 sm:w-10 p-0">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" weight="bold" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Cari Hesaplar</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Müşteri hesap yönetimi</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 sm:mr-2" weight="bold" />
            <span className="sm:inline">Yeni Hesap</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Toplam Harcama Limiti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalCreditLimit)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Toplam Borç</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Kullanılabilir Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totalAvailableCredit)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Aktif Hesaplar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{activeAccounts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg">Cari Hesap Listesi</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Tüm müşteri hesaplarını yönetin</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-sm w-full sm:w-48"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-sm w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="suspended">Askıda</SelectItem>
                    <SelectItem value="closed">Kapalı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">Hesap No</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">Müşteri</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Tip</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Telefon</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap text-right">Limit</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap text-right">Borç</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Durum</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                          Cari hesap bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAccounts.map((account) => {
                        const utilization = getCreditUtilization(account);
                        return (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                              {account.accountNumber}
                              {account.isEmployee && (
                                <Badge variant="outline" className="ml-1 text-[10px] sm:text-xs">
                                  Personel
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div className="flex items-center gap-1 sm:gap-2">
                                {account.accountType === 'corporate' ? (
                                  <Buildings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" weight="fill" />
                                ) : (
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" weight="fill" />
                                )}
                                <span className="truncate max-w-[100px] sm:max-w-none">{account.customerName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              {account.accountType === 'corporate' ? 'Tüzel' : 'Şahıs'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell whitespace-nowrap">{account.phone}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm font-medium whitespace-nowrap">
                              {formatCurrency(account.creditLimit)}
                            </TableCell>
                            <TableCell className="text-right text-xs sm:text-sm font-medium whitespace-nowrap">
                              <div className="flex flex-col items-end">
                                <span className={account.currentBalance > 0 ? 'text-destructive' : ''}>
                                  {formatCurrency(account.currentBalance)}
                                </span>
                                {account.creditLimit > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    %{utilization.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant={getStatusColor(account.status)} className="text-xs">
                                {account.status === 'active' ? 'Aktif' : account.status === 'suspended' ? 'Askıda' : 'Kapalı'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                {account.currentBalance > 0 && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => openPaymentDialog(account)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    title="Ödeme Al"
                                  >
                                    <Money className="h-3 w-3 sm:h-4 sm:w-4" weight="bold" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDetailDialog(account)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" weight="bold" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(account)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  disabled={account.isEmployee}
                                >
                                  <PencilSimple className="h-3 w-3 sm:h-4 sm:w-4" weight="bold" />
                                </Button>
                                {!account.isEmployee && account.currentBalance === 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash className="h-3 w-3 sm:h-4 sm:w-4" weight="bold" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Yeni Cari Hesap</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Yeni müşteri hesabı oluşturun</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="customerName" className="text-xs sm:text-sm">Müşteri Adı *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Ad Soyad / Firma Adı"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="accountType" className="text-xs sm:text-sm">Hesap Tipi</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value: 'individual' | 'corporate') =>
                    setFormData({ ...formData, accountType: value })
                  }
                >
                  <SelectTrigger id="accountType" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Şahıs</SelectItem>
                    <SelectItem value="corporate">Tüzel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0555 555 55 55"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@mail.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {formData.accountType === 'corporate' ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="taxNumber" className="text-xs sm:text-sm">Vergi Numarası</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="1234567890"
                    className="h-9 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="identityNumber" className="text-xs sm:text-sm">TC Kimlik No</Label>
                  <Input
                    id="identityNumber"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    placeholder="12345678901"
                    maxLength={11}
                    className="h-9 text-sm"
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="spendingLimit" className="text-xs sm:text-sm">Harcama Limiti *</Label>
                <Input
                  id="spendingLimit"
                  type="number"
                  value={formData.spendingLimit}
                  onChange={(e) => setFormData({ ...formData, spendingLimit: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="100"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="address" className="text-xs sm:text-sm">Adres</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adres bilgisi"
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ek notlar..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} size="sm" className="text-sm">
              İptal
            </Button>
            <Button onClick={handleAddAccount} size="sm" className="text-sm">
              <Plus className="h-4 w-4 mr-1.5" weight="bold" />
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Cari Hesap Düzenle</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Müşteri hesap bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-customerName" className="text-xs sm:text-sm">Müşteri Adı *</Label>
                <Input
                  id="edit-customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Ad Soyad / Firma Adı"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-accountType" className="text-xs sm:text-sm">Hesap Tipi</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value: 'individual' | 'corporate') =>
                    setFormData({ ...formData, accountType: value })
                  }
                >
                  <SelectTrigger id="edit-accountType" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Şahıs</SelectItem>
                    <SelectItem value="corporate">Tüzel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-phone" className="text-xs sm:text-sm">Telefon *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0555 555 55 55"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-email" className="text-xs sm:text-sm">E-posta</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@mail.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {formData.accountType === 'corporate' ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="edit-taxNumber" className="text-xs sm:text-sm">Vergi Numarası</Label>
                  <Input
                    id="edit-taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="1234567890"
                    className="h-9 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="edit-identityNumber" className="text-xs sm:text-sm">TC Kimlik No</Label>
                  <Input
                    id="edit-identityNumber"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    placeholder="12345678901"
                    maxLength={11}
                    className="h-9 text-sm"
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="edit-spendingLimit" className="text-xs sm:text-sm">Harcama Limiti *</Label>
                <Input
                  id="edit-spendingLimit"
                  type="number"
                  value={formData.spendingLimit}
                  onChange={(e) => setFormData({ ...formData, spendingLimit: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="100"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-address" className="text-xs sm:text-sm">Adres</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adres bilgisi"
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit-notes" className="text-xs sm:text-sm">Notlar</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ek notlar..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} size="sm" className="text-sm">
              İptal
            </Button>
            <Button onClick={handleEditAccount} size="sm" className="text-sm">
              <CheckCircle className="h-4 w-4 mr-1.5" weight="bold" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Hesap Detayları</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedAccount?.accountNumber} - {selectedAccount?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="info" className="text-xs sm:text-sm">Bilgiler</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm">Hareketler</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Harcama Limiti</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{formatCurrency(selectedAccount.creditLimit)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Mevcut Borç</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-destructive">
                        {formatCurrency(selectedAccount.currentBalance)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Toplam Harcama</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{formatCurrency(selectedAccount.totalDebt)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Toplam Ödeme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-primary">
                        {formatCurrency(selectedAccount.totalPaid)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">İletişim Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefon:</span>
                      <span className="font-medium">{selectedAccount.phone}</span>
                    </div>
                    {selectedAccount.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">E-posta:</span>
                        <span className="font-medium">{selectedAccount.email}</span>
                      </div>
                    )}
                    {selectedAccount.address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adres:</span>
                        <span className="font-medium text-right">{selectedAccount.address}</span>
                      </div>
                    )}
                    {selectedAccount.taxNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vergi No:</span>
                        <span className="font-medium">{selectedAccount.taxNumber}</span>
                      </div>
                    )}
                    {selectedAccount.identityNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TC Kimlik:</span>
                        <span className="font-medium">{selectedAccount.identityNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedAccount.currentBalance > 0 && (
                    <Button onClick={() => openPaymentDialog(selectedAccount)} className="flex-1 text-sm" size="sm">
                      <Money className="h-4 w-4 mr-1.5" weight="bold" />
                      Ödeme Al
                    </Button>
                  )}
                  {selectedAccount.status === 'active' ? (
                    <Button
                      variant="outline"
                      onClick={() => handleSuspendAccount(selectedAccount)}
                      className="flex-1 text-sm"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" weight="bold" />
                      Askıya Al
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleActivateAccount(selectedAccount)}
                      className="flex-1 text-sm"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" weight="bold" />
                      Aktif Et
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="transactions" className="mt-3 sm:mt-4">
                <ScrollArea className="h-[50vh] sm:h-[400px] rounded-md border">
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {getAccountTransactions(selectedAccount.id).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Henüz işlem bulunmuyor
                      </div>
                    ) : (
                      getAccountTransactions(selectedAccount.id).map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-start gap-2 sm:gap-3">
                                {transaction.type === 'debit' ? (
                                  <div className="bg-destructive/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                    <TrendUp className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" weight="bold" />
                                  </div>
                                ) : (
                                  <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                    <TrendDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" weight="bold" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm sm:text-base">{transaction.description}</span>
                                    {transaction.paymentMethod && (
                                      <Badge variant="outline" className="text-[10px] sm:text-xs flex items-center gap-1">
                                        {transaction.paymentMethod === 'cash' && <Money className="h-3 w-3" weight="bold" />}
                                        {transaction.paymentMethod === 'card' && <CreditCard className="h-3 w-3" weight="bold" />}
                                        {transaction.paymentMethod === 'transfer' && <Bank className="h-3 w-3" weight="bold" />}
                                        {transaction.paymentMethod === 'mobile' && <DeviceMobile className="h-3 w-3" weight="bold" />}
                                        {transaction.paymentMethod === 'cash' && 'Nakit'}
                                        {transaction.paymentMethod === 'card' && 'Kart'}
                                        {transaction.paymentMethod === 'transfer' && 'Havale'}
                                        {transaction.paymentMethod === 'mobile' && 'Mobil'}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDateTime(transaction.date)}
                                  </div>
                                  {transaction.saleNumber && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Fiş: {transaction.saleNumber}
                                    </div>
                                  )}
                                  {transaction.notes && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{transaction.notes}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div
                                  className={`text-base sm:text-lg font-bold ${
                                    transaction.type === 'debit' ? 'text-destructive' : 'text-primary'
                                  }`}
                                >
                                  {transaction.type === 'debit' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Bakiye: {formatCurrency(transaction.balanceAfter)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Ödeme Al</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedAccount?.customerName} - Bakiye: {formatCurrency(selectedAccount?.currentBalance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="paymentAmount" className="text-xs sm:text-sm">Ödeme Tutarı *</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="h-10 sm:h-11 text-base sm:text-lg font-semibold"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Ödeme Yöntemi</Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="h-16 sm:h-20 flex flex-col gap-1"
                >
                  <Money className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                  <span className="text-xs sm:text-sm">Nakit</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="h-16 sm:h-20 flex flex-col gap-1"
                >
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                  <span className="text-xs sm:text-sm">Kredi Kartı</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('transfer')}
                  className="h-16 sm:h-20 flex flex-col gap-1"
                >
                  <Bank className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                  <span className="text-xs sm:text-sm">Havale</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('mobile')}
                  className="h-16 sm:h-20 flex flex-col gap-1"
                >
                  <DeviceMobile className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                  <span className="text-xs sm:text-sm">Mobil Ödeme</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="paymentNotes" className="text-xs sm:text-sm">Notlar</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ödeme notu..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} size="sm" className="text-sm">
              İptal
            </Button>
            <Button onClick={handleMakePayment} size="sm" className="text-sm">
              <Money className="h-4 w-4 mr-1.5" weight="bold" />
              Ödeme Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
