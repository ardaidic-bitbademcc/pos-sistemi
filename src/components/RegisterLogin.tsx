import { useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { setAdminIdForSupabase, resetStorageAdapter } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Storefront, EnvelopeSimple, LockKey, Phone, Buildings, Package } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Admin, AuthSession, Branch, Category } from '@/lib/types';
import { generateId, getBaseCategories } from '@/lib/helpers';
import { Logger } from '@/lib/logger';

interface RegisterLoginProps {
  onSuccess: (session: AuthSession) => void;
  onSupplierLogin?: () => void;
}

export default function RegisterLogin({ onSuccess, onSupplierLogin }: RegisterLoginProps) {
  const [admins, setAdmins] = useData<Admin[]>('admins', []);
  const [branches, setBranches] = useData<Branch[]>('branches', []);
  const [categories, setCategories] = useData<Category[]>('categories', []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerBusinessName, setRegisterBusinessName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerBranchName, setRegisterBranchName] = useState('');
  const [registerBranchAddress, setRegisterBranchAddress] = useState('');
  const [registerBranchPhone, setRegisterBranchPhone] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDataLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Logger.warn('AUTH', 'Login başarısız: E-posta ve şifre gerekli');
      toast.error('E-posta ve şifre gerekli');
      return;
    }

    setIsLoading(true);
    
    Logger.info('AUTH', 'Login denemesi başladı', { email: loginEmail });

    const admin = (admins || []).find(
      (a) => a.email.toLowerCase() === loginEmail.toLowerCase() && a.password === loginPassword && a.isActive
    );

    if (!admin) {
      Logger.error('AUTH', 'Login başarısız: Geçersiz kimlik bilgileri', { email: loginEmail });
      toast.error('Geçersiz e-posta veya şifre');
      setIsLoading(false);
      return;
    }

    Logger.info('AUTH', 'Admin bulundu, şubeler kontrol ediliyor', { 
      adminId: admin.id,
      businessName: admin.businessName,
      totalBranches: (branches || []).filter(b => b.adminId === admin.id).length
    });

    const adminBranches = (branches || []).filter((b) => b.adminId === admin.id && b.isActive);
    
    Logger.info('AUTH', 'Aktif şube kontrolü', {
      adminId: admin.id,
      activeBranches: adminBranches.length,
      branchDetails: adminBranches.map(b => ({ id: b.id, name: b.name, isActive: b.isActive }))
    });
    
    if (adminBranches.length === 0) {
      Logger.error('AUTH', 'Login başarısız: Aktif şube yok', {
        adminId: admin.id,
        businessName: admin.businessName,
        totalBranchesForAdmin: (branches || []).filter(b => b.adminId === admin.id).length
      });
      toast.error('Hesabınıza ait aktif şube bulunmuyor. Lütfen admin ile iletişime geçin.');
      setIsLoading(false);
      return;
    }

    const firstBranch = adminBranches[0];
    
    if (!firstBranch.id) {
      Logger.error('AUTH', 'Login başarısız: Şube ID bulunamadı', {
        adminId: admin.id,
        branchData: firstBranch
      });
      toast.error('Şube bilgisi hatalı. Lütfen admin ile iletişime geçin.');
      setIsLoading(false);
      return;
    }

    const session: AuthSession = {
      adminId: admin.id,
      branchId: firstBranch.id,
      userId: admin.id,
      userRole: 'owner',
      userName: admin.businessName,
      loginTime: new Date().toISOString(),
    };

    Logger.success('AUTH', 'Login başarılı', {
      adminId: admin.id,
      businessName: admin.businessName,
      branchCount: adminBranches.length,
      selectedBranchId: session.branchId,
      selectedBranchName: firstBranch.name
    }, {
      userId: admin.id,
      userName: admin.businessName,
      branchId: session.branchId
    });

    // Supabase adapter'ı için adminId'yi set et
    if (import.meta.env.VITE_STORAGE_MODE === 'supabase') {
      setAdminIdForSupabase(admin.id);
      resetStorageAdapter();
      Logger.info('AUTH', 'Supabase adapter adminId güncellendi', { adminId: admin.id });
    }

    toast.success(`Hoş geldiniz, ${admin.businessName}! ${firstBranch.name} şubesine giriş yapıldı.`);
    
    setTimeout(() => {
      onSuccess(session);
      setIsLoading(false);
    }, 500);
  };

  const handleRegister = async () => {
    if (
      !registerEmail.trim() ||
      !registerPassword.trim() ||
      !registerConfirmPassword.trim() ||
      !registerBusinessName.trim() ||
      !registerPhone.trim() ||
      !registerBranchName.trim()
    ) {
      Logger.warn('AUTH', 'Kayıt başarısız: Eksik alanlar var');
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      Logger.warn('AUTH', 'Kayıt başarısız: Şifreler eşleşmiyor');
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (registerPassword.length < 6) {
      Logger.warn('AUTH', 'Kayıt başarısız: Şifre çok kısa');
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    const emailExists = (admins || []).some((a) => a.email.toLowerCase() === registerEmail.toLowerCase());
    if (emailExists) {
      Logger.warn('AUTH', 'Kayıt başarısız: E-posta kullanımda', { email: registerEmail });
      toast.error('Bu e-posta adresi zaten kullanılıyor');
      return;
    }

    setIsLoading(true);
    
    Logger.info('AUTH', 'Yeni hesap oluşturuluyor', {
      businessName: registerBusinessName,
      branchName: registerBranchName
    });

    const newAdminId = generateId();
    const newBranchId = generateId();

    const newAdmin: Admin = {
      id: newAdminId,
      email: registerEmail.trim(),
      password: registerPassword,
      businessName: registerBusinessName.trim(),
      phone: registerPhone.trim(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const newBranch: Branch = {
      id: newBranchId,
      name: registerBranchName.trim(),
      code: `BR${Date.now().toString().slice(-6)}`,
      address: registerBranchAddress.trim() || 'Adres bilgisi girilmedi',
      phone: registerBranchPhone.trim() || registerPhone.trim(),
      isActive: true,
      adminId: newAdminId,
      createdAt: new Date().toISOString(),
    };

    const baseCategories = getBaseCategories().map(cat => ({
      ...cat,
      id: `${newAdminId}-${cat.id}`,
      adminId: newAdminId,
      branchId: newBranchId,
    }));

    setAdmins((current) => [...(current || []), newAdmin]);
    setBranches((current) => [...(current || []), newBranch]);
    setCategories((current) => [...(current || []), ...baseCategories]);

    Logger.success('AUTH', 'Yeni hesap oluşturuldu', {
      adminId: newAdminId,
      businessName: newAdmin.businessName,
      branchId: newBranchId,
      branchName: newBranch.name,
      categoryCount: baseCategories.length
    }, {
      userId: newAdminId,
      userName: newAdmin.businessName,
      branchId: newBranchId,
      branchName: newBranch.name
    });

    // Supabase adapter'ı için adminId'yi set et
    if (import.meta.env.VITE_STORAGE_MODE === 'supabase') {
      setAdminIdForSupabase(newAdminId);
      resetStorageAdapter();
      Logger.info('AUTH', 'Supabase adapter adminId güncellendi', { adminId: newAdminId });
    }

    const session: AuthSession = {
      adminId: newAdminId,
      branchId: newBranchId,
      userId: newAdminId,
      userRole: 'owner',
      userName: newAdmin.businessName,
      loginTime: new Date().toISOString(),
    };

    toast.success(`Hesabınız başarıyla oluşturuldu! ${newBranch.name} şubesine giriş yapıldı.`);
    
    setTimeout(() => {
      onSuccess(session);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Storefront className="h-12 w-12 text-primary" weight="duotone" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">POSACA</CardTitle>
          <CardDescription>İşletme Yönetim Sistemi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-posta</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@isletme.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Şifre</Label>
                <div className="relative">
                  <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">E-posta *</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ornek@isletme.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Şifre *</Label>
                <div className="relative">
                  <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Şifre Tekrar *</Label>
                <div className="relative">
                  <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Şifreyi tekrar girin"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-business-name">İşletme Adı *</Label>
                <div className="relative">
                  <Buildings className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-business-name"
                    placeholder="Örnek Kafe & Restoran"
                    value={registerBusinessName}
                    onChange={(e) => setRegisterBusinessName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">Telefon *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-phone"
                    placeholder="05XX XXX XX XX"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">İlk Şube Bilgileri</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="register-branch-name">Şube Adı *</Label>
                  <Input
                    id="register-branch-name"
                    placeholder="Merkez Şube"
                    value={registerBranchName}
                    onChange={(e) => setRegisterBranchName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-branch-address">Şube Adresi</Label>
                  <Input
                    id="register-branch-address"
                    placeholder="Şube adresi (opsiyonel)"
                    value={registerBranchAddress}
                    onChange={(e) => setRegisterBranchAddress(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-branch-phone">Şube Telefonu</Label>
                  <Input
                    id="register-branch-phone"
                    placeholder="Şube telefonu (opsiyonel)"
                    value={registerBranchPhone}
                    onChange={(e) => setRegisterBranchPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button onClick={handleRegister} className="w-full" disabled={isLoading}>
                {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Button>
            </TabsContent>
          </Tabs>
          
          {onSupplierLogin && (
            <div className="mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onSupplierLogin}
              >
                <Package className="h-4 w-4 mr-2" />
                Tedarikçi Girişi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
