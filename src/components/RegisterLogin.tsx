import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Storefront, EnvelopeSimple, LockKey, Phone, Buildings } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { AuthSession, Branch } from '@/lib/types';

interface RegisterLoginProps {
  onSuccess: (session: AuthSession, branches?: Branch[]) => void;
}

export default function RegisterLogin({ onSuccess }: RegisterLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('E-posta ve şifre gerekli');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Login attempt:', { email: loginEmail });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        toast.error(data.error || 'Giriş başarısız');
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        toast.error('Session bilgisi alınamadı');
        setIsLoading(false);
        return;
      }

      // Save branches to KV storage if returned
      if (data.branches && data.branches.length > 0) {
        console.log('Saving branches to KV:', data.branches);
        try {
          const kvResponse = await fetch('/api/kv/branches', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: data.branches }),
          });
          
          if (!kvResponse.ok) {
            console.error('Failed to save branches to KV:', await kvResponse.text());
          } else {
            console.log('Branches saved to KV successfully');
          }
        } catch (kvError) {
          console.error('KV write error:', kvError);
        }
      }

      toast.success(`Hoş geldiniz, ${data.admin?.businessName || 'Kullanıcı'}`);
      
      console.log('Calling onSuccess with session and branches:', data.session, data.branches);
      
      try {
        await onSuccess(data.session, data.branches || []);
        console.log('onSuccess completed successfully');
      } catch (callbackError) {
        console.error('onSuccess callback error:', callbackError);
        toast.error('Giriş işlemi sırasında bir hata oluştu');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(`Giriş sırasında bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setIsLoading(false);
    }
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
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Register attempt:', { email: registerEmail, businessName: registerBusinessName });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          businessName: registerBusinessName,
          phone: registerPhone,
          branchName: registerBranchName,
          branchAddress: registerBranchAddress,
          branchPhone: registerBranchPhone,
        }),
      });

      console.log('Register response status:', response.status);
      const data = await response.json();
      console.log('Register response data:', data);

      if (!response.ok) {
        toast.error(data.error || 'Kayıt başarısız');
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        toast.error('Session bilgisi alınamadı');
        setIsLoading(false);
        return;
      }

      // Save branches to KV storage
      if (data.branches && data.branches.length > 0) {
        console.log('Saving branches to KV:', data.branches);
        
        try {
          const kvResponse = await fetch('/api/kv/branches', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: data.branches }),
          });
          
          if (!kvResponse.ok) {
            console.error('Failed to save branches to KV:', await kvResponse.text());
          } else {
            console.log('Branches saved to KV successfully');
          }
        } catch (kvError) {
          console.error('KV write error:', kvError);
        }
      }

      toast.success('Hesabınız başarıyla oluşturuldu!');
      
      console.log('Calling onSuccess with session and branches:', data.session, data.branches);
      
      try {
        await onSuccess(data.session, data.branches || []);
        console.log('onSuccess completed successfully');
      } catch (callbackError) {
        console.error('onSuccess callback error:', callbackError);
        toast.error('Giriş işlemi sırasında bir hata oluştu');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Register error:', error);
      toast.error(`Kayıt sırasında bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setIsLoading(false);
    }
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
        </CardContent>
      </Card>
    </div>
  );
}
