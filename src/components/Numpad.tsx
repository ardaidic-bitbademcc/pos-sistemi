import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Backspace } from '@phosphor-icons/react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

export default function Numpad({ value, onChange, onEnter }: NumpadProps) {
  const handleNumberClick = (num: string) => {
    onChange(value + num);
  };

  const handleDecimal = () => {
    if (!value.includes('.')) {
      onChange(value + '.');
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    }
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {['7', '8', '9'].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-14 text-xl font-semibold"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        {['4', '5', '6'].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-14 text-xl font-semibold"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        {['1', '2', '3'].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-14 text-xl font-semibold"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-xl font-semibold"
          onClick={handleClear}
        >
          C
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-xl font-semibold"
          onClick={() => handleNumberClick('0')}
        >
          0
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 text-xl font-semibold"
          onClick={handleDecimal}
        >
          .
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 col-span-2"
          onClick={handleBackspace}
        >
          <Backspace className="h-6 w-6" weight="bold" />
        </Button>
        {onEnter && (
          <Button
            variant="default"
            size="lg"
            className="h-14"
            onClick={handleEnter}
          >
            OK
          </Button>
        )}
      </div>
    </Card>
  );
}
