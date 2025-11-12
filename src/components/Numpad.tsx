import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Backspace, ArrowUp } from '@phosphor-icons/react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  mode?: 'number' | 'text';
}

export default function Numpad({ value, onChange, onEnter, mode = 'number' }: NumpadProps) {
  const [isUpperCase, setIsUpperCase] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(mode === 'number' ? 'numbers' : 'letters');

  const handleKeyClick = (key: string) => {
    if (activeTab === 'letters' && key.length === 1) {
      onChange(value + (isUpperCase ? key.toUpperCase() : key.toLowerCase()));
    } else {
      onChange(value + key);
    }
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

  const handleSpace = () => {
    onChange(value + ' ');
  };

  const handleEnter = () => {
    if (onEnter) {
      onEnter();
    }
  };

  const toggleCase = () => {
    setIsUpperCase(!isUpperCase);
  };

  const letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç'],
  ];

  if (mode === 'number') {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {['7', '8', '9'].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="lg"
              className="h-14 text-xl font-semibold"
              onClick={() => handleKeyClick(num)}
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
              onClick={() => handleKeyClick(num)}
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
              onClick={() => handleKeyClick(num)}
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
            onClick={() => handleKeyClick('0')}
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

  return (
    <Card className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="letters">Harfler</TabsTrigger>
          <TabsTrigger value="numbers">Rakamlar</TabsTrigger>
        </TabsList>

        <TabsContent value="letters" className="mt-0">
          <div className="space-y-2">
            {letterRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((letter) => (
                  <Button
                    key={letter}
                    variant="outline"
                    size="sm"
                    className="h-12 min-w-[32px] px-2 text-lg font-medium"
                    onClick={() => handleKeyClick(letter)}
                  >
                    {isUpperCase ? letter.toUpperCase() : letter}
                  </Button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className={`h-12 px-4 ${isUpperCase ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={toggleCase}
              >
                <ArrowUp className="h-5 w-5" weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-1 max-w-xs"
                onClick={handleSpace}
              >
                Boşluk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-12 px-4"
                onClick={handleBackspace}
              >
                <Backspace className="h-5 w-5" weight="bold" />
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-12 px-6"
                onClick={handleClear}
              >
                Temizle
              </Button>
              {onEnter && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-12 px-8"
                  onClick={handleEnter}
                >
                  Tamam
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="numbers" className="mt-0">
          <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9'].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                className="h-14 text-xl font-semibold"
                onClick={() => handleKeyClick(num)}
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
                onClick={() => handleKeyClick(num)}
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
                onClick={() => handleKeyClick(num)}
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
              onClick={() => handleKeyClick('0')}
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
        </TabsContent>
      </Tabs>
    </Card>
  );
}
