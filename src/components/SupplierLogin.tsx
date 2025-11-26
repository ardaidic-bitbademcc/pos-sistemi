import { useState } from 'react';
import { useKV } from '../hooks/use-kv-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Storefront, EnvelopeSimple, LockKey, ArrowLeft, Info } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BSupplier, SupplierAuthSession } from '@/lib/types';
import { Logger } from '@/lib/logger';

interface SupplierLoginProps {
  onSuccess: (session: SupplierAuthSession) => void;
  onBack: () => void;
}

export default function SupplierLogin({ onSuccess, onBack }: SupplierLoginProps) {
  const [suppliers] = useKV<B2BSupplier[]>('b2b-suppliers', []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Logger.warn('SUPPLIER_AUTH', 'Login başarısız: E-posta ve şifre gerekli');
      toast.error('E-posta ve şifre gerekli');
      return;
    }

    setIsLoading(true);
    
    Logger.info('SUPPLIER_AUTH', 'Tedarikçi login denemesi başladı', { email: loginEmail });

    const supplier = (suppliers || []).find(
      (s) => s.email.toLowerCase() === loginEmail.toLowerCase() && s.password === loginPassword && s.isActive
    );

    if (!supplier) {
      Logger.error('SUPPLIER_AUTH', 'Login başarısız: Geçersiz kimlik bilgileri', { email: loginEmail });
      toast.error('Geçersiz e-posta veya şifre');
      setIsLoading(false);
      return;
    }

    const session: SupplierAuthSession = {
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      loginTime: new Date().toISOString(),
    };

    Logger.success('SUPPLIER_AUTH', 'Tedarikçi login başarılı', {
      supplierId: supplier.id,
      companyName: supplier.companyName,
      isDemo: supplier.isDemo || false
    }, {
      userId: supplier.id,
      userName: supplier.companyName
    });

    toast.success(`Hoş geldiniz, ${supplier.companyName}`);
    
    setTimeout(() => {
      onSuccess(session);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Storefront className="h-12 w-12 text-primary" weight="duotone" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Tedarikçi Paneli</CardTitle>
          <CardDescription>B2B Tedarik Platformu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">Demo Hesap Bilgileri:</div>
              <div>E-posta: <strong>demo@tedarikci.com</strong></div>
              <div>Şifre: <strong>demo123</strong></div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="supplier-email">E-posta</Label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="supplier-email"
                type="email"
                placeholder="ornek@tedarikci.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-password">Şifre</Label>
            <div className="relative">
              <LockKey className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="supplier-password"
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
            {isLoading ? 'Giriş yapılıyor...' : 'Tedarikçi Girişi'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
