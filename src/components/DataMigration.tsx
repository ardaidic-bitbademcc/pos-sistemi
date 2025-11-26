import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, CircleNotch, Warning } from '@phosphor-icons/react';
import { migrateAllData, checkMigrationStatus, resetMigration, type MigrationResult } from '@/lib/data-migration';

export default function DataMigration() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
      setError(null);
    } catch (err) {
      setError('Migration durumu kontrol edilemedi');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      const result = await migrateAllData();
      console.log('Migration result received:', result);
      setMigrationStatus(result);
      
      // Wait a bit then verify status was saved
      setTimeout(async () => {
        const status = await checkMigrationStatus();
        console.log('Verification check:', status);
        if (status) {
          setMigrationStatus(status);
          // Dispatch event to notify App.tsx
          window.dispatchEvent(new Event('migration-completed'));
        }
      }, 1000);
    } catch (err) {
      setError('Migration başarısız oldu: ' + (err as Error).message);
      console.error(err);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleResetMigration = async () => {
    if (!confirm('Migration durumunu sıfırlamak istediğinize emin misiniz? Bu işlem migration\'ı tekrar çalıştırmanıza olanak sağlar.')) {
      return;
    }
    
    try {
      await resetMigration();
      setMigrationStatus(null);
      setError(null);
    } catch (err) {
      setError('Migration sıfırlama başarısız oldu');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <CircleNotch className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Migration durumu kontrol ediliyor...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning className="h-6 w-6 text-primary" weight="fill" />
            Veri Migration
          </CardTitle>
          <CardDescription>
            Tüm mevcut verilere adminId ve branchId ekleniyor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {migrationStatus ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" weight="fill" />
                <AlertDescription className="text-green-700">
                  Migration başarıyla tamamlandı!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Migration Detayları:</p>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <p><strong>Tarih:</strong> {new Date(migrationStatus.timestamp).toLocaleString('tr-TR')}</p>
                  <p><strong>Migrate Edilen Tablolar:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {migrationStatus.migratedTables.map((table) => (
                      <li key={table} className="text-muted-foreground">{table}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleResetMigration}
                  className="flex-1"
                >
                  Migration'ı Sıfırla
                </Button>
                <Button 
                  onClick={async () => {
                    await checkStatus();
                    if (migrationStatus?.migrated) {
                      window.location.href = '/';
                    }
                  }}
                  className="flex-1"
                >
                  Uygulamayı Yeniden Başlat
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Warning className="h-4 w-4 text-amber-600" weight="fill" />
                <AlertDescription>
                  Migration henüz çalıştırılmamış. Tüm verilere adminId ve branchId eklemek için aşağıdaki butona tıklayın.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">Migration şu tabloları güncelleyecek:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                  <li>Çalışanlar (employees)</li>
                  <li>Ürünler (products)</li>
                  <li>Menü Ögeleri (menuItems)</li>
                  <li>Kategoriler (categories)</li>
                  <li>Şubeler (branches)</li>
                  <li>Satışlar (sales)</li>
                  <li>Maaş Hesaplamaları (salaryCalculations)</li>
                  <li>Görevler (tasks)</li>
                  <li>Cari Hesaplar (customer-accounts)</li>
                  <li>B2B Tedarikçiler (b2b-suppliers)</li>
                  <li>B2B Ürünler (b2b-products)</li>
                  <li>B2B Siparişler (b2b-orders)</li>
                  <li>Numune Talepleri (b2b-sample-requests)</li>
                  <li>Faturalar (invoices)</li>
                  <li>Giderler (expenses)</li>
                  <li>Kasa İşlemleri (cash-transactions)</li>
                  <li>Reçeteler (recipes)</li>
                </ul>
                <p className="text-amber-700 mt-3">
                  ⚠️ Bu işlem geri alınamaz. Tüm veriler güncellenir.
                </p>
              </div>

              <Button 
                onClick={runMigration} 
                disabled={isMigrating}
                className="w-full"
                size="lg"
              >
                {isMigrating ? (
                  <>
                    <CircleNotch className="mr-2 h-5 w-5 animate-spin" />
                    Migration Çalışıyor...
                  </>
                ) : (
                  'Migration\'ı Başlat'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
