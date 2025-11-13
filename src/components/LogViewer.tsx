import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MagnifyingGlass,
  Trash,
  Download,
  Bug,
  Info,
  Warning,
  XCircle,
  CheckCircle,
  FunnelSimple,
  ArrowsClockwise,
  Calendar,
  Code,
  Eye,
  CurrencyCircleDollar,
  Wallet
} from '@phosphor-icons/react';
import { Logger, type LogEntry, type LogLevel } from '@/lib/logger';
import { formatDateTime } from '@/lib/helpers';
import { toast } from 'sonner';

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showPaymentLogsOnly, setShowPaymentLogsOnly] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const allLogs = await Logger.getAllLogs();
      setLogs(allLogs.reverse());
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Log yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    let filtered = [...logs];

    if (showPaymentLogsOnly) {
      filtered = filtered.filter(log => 
        log.category === 'payment' || 
        log.category === 'transaction' ||
        log.category === 'cash-register'
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(query) ||
          log.category.toLowerCase().includes(query) ||
          log.userName?.toLowerCase().includes(query) ||
          log.branchName?.toLowerCase().includes(query)
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, levelFilter, categoryFilter, showPaymentLogsOnly]);

  const handleClearLogs = async () => {
    if (window.confirm('Tüm logları silmek istediğinizden emin misiniz?')) {
      await Logger.clearLogs();
      setLogs([]);
      toast.success('Tüm loglar temizlendi');
    }
  };

  const handleExportLogs = async () => {
    try {
      const exportData = await Logger.exportLogs();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Loglar dışa aktarıldı');
    } catch (error) {
      toast.error('Dışa aktarma başarısız');
    }
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  const getCategories = (): string[] => {
    const categories = new Set(logs.map(log => log.category));
    return Array.from(categories).sort();
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return <Bug className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warn':
        return <Warning className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'debug':
        return 'bg-gray-500';
      case 'info':
        return 'bg-blue-500';
      case 'warn':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
    }
  };

  const getLevelName = (level: LogLevel): string => {
    switch (level) {
      case 'debug':
        return 'Debug';
      case 'info':
        return 'Bilgi';
      case 'warn':
        return 'Uyarı';
      case 'error':
        return 'Hata';
      case 'success':
        return 'Başarılı';
    }
  };

  const stats = {
    total: logs.length,
    debug: logs.filter(l => l.level === 'debug').length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
    success: logs.filter(l => l.level === 'success').length,
    payments: logs.filter(l => l.category === 'payment').length,
    transactions: logs.filter(l => l.category === 'transaction').length,
    cashRegister: logs.filter(l => l.category === 'cash-register').length,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Sistem Logları
              </CardTitle>
              <CardDescription>
                Sistem olayları ve hata ayıklama bilgileri
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50' : ''}
              >
                <ArrowsClockwise className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Otomatik Yenileme Açık' : 'Otomatik Yenileme'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
                <ArrowsClockwise className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearLogs}>
                <Trash className="h-4 w-4 mr-2" />
                Temizle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Toplam</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Bug className="h-3 w-3" />
                Debug
              </div>
              <div className="text-2xl font-bold">{stats.debug}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Bilgi
              </div>
              <div className="text-2xl font-bold">{stats.info}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Warning className="h-3 w-3" />
                Uyarı
              </div>
              <div className="text-2xl font-bold">{stats.warn}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Hata
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Başarılı
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="text-xs text-blue-700 flex items-center gap-1 font-medium">
                <CurrencyCircleDollar className="h-3 w-3" />
                Ödeme Logları
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.payments}</div>
            </Card>
            <Card className="p-3 bg-purple-50 border-purple-200">
              <div className="text-xs text-purple-700 flex items-center gap-1 font-medium">
                <ArrowsClockwise className="h-3 w-3" />
                İşlem Logları
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.transactions}</div>
            </Card>
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="text-xs text-green-700 flex items-center gap-1 font-medium">
                <Wallet className="h-3 w-3" />
                Kasa Logları
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.cashRegister}</div>
            </Card>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Loglarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showPaymentLogsOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPaymentLogsOnly(!showPaymentLogsOnly)}
              className="shrink-0"
            >
              <CurrencyCircleDollar className="h-4 w-4 mr-2" />
              {showPaymentLogsOnly ? 'Tüm Loglar' : 'Sadece Ödemeler'}
            </Button>
            <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Seviye" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Seviyeler</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Bilgi</SelectItem>
                <SelectItem value="warn">Uyarı</SelectItem>
                <SelectItem value="error">Hata</SelectItem>
                <SelectItem value="success">Başarılı</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {logs.length === 0 ? 'Henüz log kaydı yok' : 'Filtrelere uygun log bulunamadı'}
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <Card
                    key={log.id}
                    className={`p-3 hover:bg-accent cursor-pointer transition-colors ${
                      log.level === 'error' ? 'border-red-200' : ''
                    }`}
                    onClick={() => handleViewDetails(log)}
                  >
                    <div className="flex items-start gap-3">
                      <Badge className={`${getLevelColor(log.level)} text-white shrink-0 mt-0.5`}>
                        <span className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          {getLevelName(log.level)}
                        </span>
                      </Badge>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm">{log.message}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(log.timestamp)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono">
                            {log.category}
                          </Badge>
                          {log.userName && (
                            <Badge variant="secondary">
                              👤 {log.userName}
                            </Badge>
                          )}
                          {log.branchName && (
                            <Badge variant="secondary">
                              🏢 {log.branchName}
                            </Badge>
                          )}
                          {log.data && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              Veri var
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(log);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  <Badge className={`${getLevelColor(selectedLog.level)} text-white`}>
                    <span className="flex items-center gap-1">
                      {getLevelIcon(selectedLog.level)}
                      {getLevelName(selectedLog.level)}
                    </span>
                  </Badge>
                  Log Detayları
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatDateTime(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Mesaj</div>
                <Card className="p-3">
                  <div className="text-sm">{selectedLog.message}</div>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Kategori</div>
                  <Badge variant="outline" className="font-mono">
                    {selectedLog.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Seviye</div>
                  <Badge className={`${getLevelColor(selectedLog.level)} text-white`}>
                    {getLevelName(selectedLog.level)}
                  </Badge>
                </div>
              </div>

              {(selectedLog.userName || selectedLog.branchName) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.userName && (
                    <div>
                      <div className="text-sm font-medium mb-2">Kullanıcı</div>
                      <div className="text-sm">{selectedLog.userName}</div>
                    </div>
                  )}
                  {selectedLog.branchName && (
                    <div>
                      <div className="text-sm font-medium mb-2">Şube</div>
                      <div className="text-sm">{selectedLog.branchName}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.data && (
                <div>
                  <div className="text-sm font-medium mb-2">Ek Veri</div>
                  <Card className="p-3 bg-muted">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium">Log ID</div>
                  <div className="font-mono mt-1">{selectedLog.id}</div>
                </div>
                <div>
                  <div className="font-medium">Zaman Damgası</div>
                  <div className="font-mono mt-1">{selectedLog.timestamp}</div>
                </div>
                {selectedLog.userId && (
                  <div>
                    <div className="font-medium">Kullanıcı ID</div>
                    <div className="font-mono mt-1">{selectedLog.userId}</div>
                  </div>
                )}
                {selectedLog.branchId && (
                  <div>
                    <div className="font-medium">Şube ID</div>
                    <div className="font-mono mt-1">{selectedLog.branchId}</div>
                  </div>
                )}
                {selectedLog.sessionId && (
                  <div>
                    <div className="font-medium">Oturum ID</div>
                    <div className="font-mono mt-1">{selectedLog.sessionId}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
