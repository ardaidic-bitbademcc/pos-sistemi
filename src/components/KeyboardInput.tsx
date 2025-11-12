import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from '@phosphor-icons/react';
import Numpad from '@/components/Numpad';

interface KeyboardInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'number';
  disabled?: boolean;
  onEnter?: () => void;
  label?: string;
}

export default function KeyboardInput({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  disabled = false,
  onEnter,
  label,
}: KeyboardInputProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleOpenKeyboard = () => {
    setLocalValue(value);
    setShowKeyboard(true);
  };

  const handleConfirm = () => {
    onChange(localValue);
    setShowKeyboard(false);
    if (onEnter) {
      onEnter();
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setShowKeyboard(false);
  };

  return (
    <>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          type={type}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              onEnter();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleOpenKeyboard}
          disabled={disabled}
        >
          <Keyboard className="h-4 w-4" weight="bold" />
        </Button>
      </div>

      <Dialog open={showKeyboard} onOpenChange={setShowKeyboard}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{label || placeholder || 'Giriş'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={placeholder}
              className="text-lg h-12"
              type={type}
            />
            <Numpad
              value={localValue}
              onChange={setLocalValue}
              onEnter={handleConfirm}
              mode={type === 'number' ? 'number' : 'text'}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                İptal
              </Button>
              <Button onClick={handleConfirm}>Tamam</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
