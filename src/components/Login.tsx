import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Backspace, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserCredential, UserRole } from '@/lib/types';

interface LoginProps {
  onLogin: (role: UserRole, userName: string) => void;
}

const DEFAULT_USERS: UserCredential[] = [
  { id: '1', name: 'Admin', pin: '3010', role: 'owner', isActive: true },
  { id: '2', name: 'Yönetici', pin: '1234', role: 'manager', isActive: true },
  { id: '3', name: 'Kasiyer', pin: '5678', role: 'cashier', isActive: true },
  { id: '4', name: 'Garson', pin: '9999', role: 'waiter', isActive: true },
];

export default function Login({ onLogin }: LoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [users] = useKV<UserCredential[]>('userCredentials', DEFAULT_USERS);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      const user = users?.find(u => u.pin === pin && u.isActive);
      if (user) {
        setError(false);
        onLogin(user.role, user.name);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          setShake(false);
        }, 600);
      }
    }
  }, [pin, users, onLogin]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const getPinDisplay = () => {
    return Array(4).fill(null).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          scale: i === pin.length && pin.length < 4 ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
          error 
            ? 'border-destructive bg-destructive/10' 
            : i < pin.length 
            ? 'border-primary bg-primary/10' 
            : 'border-border bg-muted'
        }`}
      >
        {i < pin.length && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`w-3 h-3 rounded-full ${error ? 'bg-destructive' : 'bg-primary'}`}
          />
        )}
      </motion.div>
    ));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-8">
            <motion.div
              className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center"
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Lock className="w-10 h-10 text-primary" weight="fill" />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-semibold">NEXUSPOS</CardTitle>
              <CardDescription className="text-base mt-2">
                Devam etmek için PIN kodunuzu girin
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="flex justify-center gap-3">
              {getPinDisplay()}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center"
                >
                  <Badge variant="destructive" className="text-sm">
                    Hatalı PIN kodu
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <motion.div key={num} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-16 text-2xl font-semibold hover:bg-primary/10 hover:border-primary"
                    onClick={() => handleNumberClick(num.toString())}
                    disabled={pin.length >= 4}
                  >
                    {num}
                  </Button>
                </motion.div>
              ))}
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-16 hover:bg-destructive/10 hover:border-destructive"
                  onClick={handleClear}
                  disabled={pin.length === 0}
                >
                  <X className="w-6 h-6" weight="bold" />
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-16 text-2xl font-semibold hover:bg-primary/10 hover:border-primary"
                  onClick={() => handleNumberClick('0')}
                  disabled={pin.length >= 4}
                >
                  0
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-16 hover:bg-muted-foreground/10"
                  onClick={handleBackspace}
                  disabled={pin.length === 0}
                >
                  <Backspace className="w-6 h-6" weight="bold" />
                </Button>
              </motion.div>
            </div>

            <div className="border-t pt-6 space-y-2">
              <p className="text-xs text-center text-muted-foreground">Demo Kullanıcılar</p>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_USERS.map((user) => (
                  <Badge key={user.id} variant="outline" className="justify-center text-xs py-1">
                    {user.name}: {user.pin}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
