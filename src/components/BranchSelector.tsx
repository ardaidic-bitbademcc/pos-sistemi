import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Buildings, Check, MapPin, Phone } from '@phosphor-icons/react';
import type { Branch, AuthSession } from '@/lib/types';
import { motion } from 'framer-motion';

interface BranchSelectorProps {
  authSession: AuthSession;
  onSelectBranch: (branchId: string) => void;
}

export default function BranchSelector({ authSession, onSelectBranch }: BranchSelectorProps) {
  const [branches] = useKV<Branch[]>('branches', []);

  const adminBranches = (branches || []).filter(
    (b) => b.adminId === authSession.adminId && b.isActive
  );

  const currentBranch = adminBranches.find((b) => b.id === authSession.branchId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Buildings className="h-8 w-8 text-primary" weight="bold" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Şube Seçimi</h1>
          <p className="text-muted-foreground">
            Çalışmak istediğiniz şubeyi seçin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminBranches.map((branch) => {
            const isCurrentBranch = branch.id === authSession.branchId;
            
            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg relative overflow-hidden ${
                    isCurrentBranch ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => onSelectBranch(branch.id)}
                >
                  {isCurrentBranch && (
                    <div className="absolute top-3 right-3">
                      <div className="p-1.5 rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" weight="bold" />
                      </div>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Buildings className="h-5 w-5 text-primary" weight="bold" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">{branch.name}</CardTitle>
                          <CardDescription className="text-xs">Kod: {branch.code}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {branch.address}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">{branch.phone}</p>
                      </div>
                    </div>

                    {branch.managerName && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Yönetici: <span className="font-medium text-foreground">{branch.managerName}</span>
                        </p>
                      </div>
                    )}

                    <Badge variant={isCurrentBranch ? 'default' : 'secondary'} className="w-full justify-center">
                      {isCurrentBranch ? 'Aktif Şube' : 'Seç'}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {adminBranches.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="p-4 rounded-full bg-muted inline-block mb-4">
                <Buildings className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Henüz şube bulunmuyor</h3>
              <p className="text-muted-foreground text-sm">
                Yeni bir şube eklemek için şube yönetimi modülünü kullanın
              </p>
            </CardContent>
          </Card>
        )}

        {currentBranch && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Şu anda <span className="font-medium text-foreground">{currentBranch.name}</span> şubesinde çalışıyorsunuz
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
