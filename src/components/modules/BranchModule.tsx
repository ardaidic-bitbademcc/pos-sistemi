import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Buildings, TrendUp, Package, ArrowsLeftRight, Check } from '@phosphor-icons/react';
import type { Branch, Product } from '@/lib/types';
import { formatNumber } from '@/lib/helpers';
import { toast } from 'sonner';

interface BranchModuleProps {
  onBack: () => void;
}

interface StockTransfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  productId: string;
  quantity: number;
  date: string;
  status: 'pending' | 'completed';
}

export default function BranchModule({ onBack }: BranchModuleProps) {
  const [branches] = useKV<Branch[]>('branches', []);
  const [products] = useKV<Product[]>('products', []);
  const [stockTransfers, setStockTransfers] = useKV<StockTransfer[]>('stockTransfers', []);
  
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');

  const activeBranches = (branches || []).filter((b) => b.isActive);

  const handleTransferStock = () => {
    if (!fromBranchId || !toBranchId || !selectedProductId || !transferQuantity) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error('Aynı şubeye transfer yapılamaz');
      return;
    }

    const quantity = parseInt(transferQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }

    const newTransfer: StockTransfer = {
      id: `transfer-${Date.now()}`,
      fromBranchId,
      toBranchId,
      productId: selectedProductId,
      quantity,
      date: new Date().toISOString(),
      status: 'completed'
    };

    setStockTransfers((current) => [...(current || []), newTransfer]);

    const product = products?.find(p => p.id === selectedProductId);
    const fromBranch = activeBranches.find(b => b.id === fromBranchId);
    const toBranch = activeBranches.find(b => b.id === toBranchId);

    toast.success(
      `${quantity} adet ${product?.name} ${fromBranch?.name}'den ${toBranch?.name}'e transfer edildi`
    );

    setIsTransferDialogOpen(false);
    setFromBranchId('');
    setToBranchId('');
    setSelectedProductId('');
    setTransferQuantity('');
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Şube Yönetimi</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Çoklu şube senkronizasyonu ve yönetim</p>
          </div>
        </div>
        <Button onClick={() => setIsTransferDialogOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm h-9">
          <ArrowsLeftRight className="h-4 w-4 sm:mr-2" weight="bold" />
          <span className="hidden sm:inline">Stok Transferi</span>
          <span className="sm:hidden">Transfer</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {(stockTransfers || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son Stok Transferleri</CardTitle>
            <CardDescription>Şubeler arası son transfer hareketleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stockTransfers || []).slice(-5).reverse().map((transfer) => {
                const product = products?.find(p => p.id === transfer.productId);
                const fromBranch = activeBranches.find(b => b.id === transfer.fromBranchId);
                const toBranch = activeBranches.find(b => b.id === transfer.toBranchId);
                
                return (
                  <div key={transfer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ArrowsLeftRight className="h-4 w-4 text-primary" weight="bold" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fromBranch?.name} → {toBranch?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-sm font-tabular-nums">{transfer.quantity} adet</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transfer.date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" weight="bold" />
                        Tamamlandı
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stok Transferi</DialogTitle>
            <DialogDescription>
              Şubeler arasında ürün stoğu transferi yapın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-branch">Gönderen Şube</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger id="from-branch">
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {activeBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-branch">Alıcı Şube</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger id="to-branch">
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {activeBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Ürün</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(products || []).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Miktar</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Transfer miktarı"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleTransferStock}>
              <ArrowsLeftRight className="h-4 w-4 mr-2" weight="bold" />
              Transfer Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
