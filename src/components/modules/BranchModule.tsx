import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Buildings, TrendUp, Package } from '@phosphor-icons/react';
import type { Branch, Product } from '@/lib/types';
import { formatNumber } from '@/lib/helpers';

interface BranchModuleProps {
  onBack: () => void;
}

export default function BranchModule({ onBack }: BranchModuleProps) {
  const [branches] = useKV<Branch[]>('branches', []);
  const [products] = useKV<Product[]>('products', []);

  const activeBranches = (branches || []).filter((b) => b.isActive);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Şube Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Çoklu şube senkronizasyonu ve yönetim</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeBranches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  <CardDescription className="text-xs">Kod: {branch.code}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Buildings className="h-5 w-5 text-primary" weight="bold" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{branch.address}</p>
                <p className="text-sm text-muted-foreground">{branch.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Aktif</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Ürün Sayısı</p>
                  <p className="text-lg font-semibold font-tabular-nums">
                    {formatNumber((products || []).length)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Performans</p>
                  <div className="flex items-center gap-1">
                    <TrendUp className="h-4 w-4 text-accent" weight="bold" />
                    <span className="text-lg font-semibold font-tabular-nums">+12%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Merkezi Ürün Yönetimi</CardTitle>
          <CardDescription>Tüm şubelere ürün güncellemeleri yayınlayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Package className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Merkezi ürün katalogunda {formatNumber((products || []).length)} ürün bulunuyor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
