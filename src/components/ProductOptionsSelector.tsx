import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, X } from '@phosphor-icons/react';
import type { Product, ProductOption } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';

interface ProductOptionsSelectorProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedOptions: {
    optionName: string;
    choiceName: string;
    priceModifier: number;
  }[]) => void;
}

export default function ProductOptionsSelector({
  product,
  open,
  onClose,
  onConfirm,
}: ProductOptionsSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const handleSingleSelect = (optionId: string, choiceId: string) => {
    setSelections((prev) => ({
      ...prev,
      [optionId]: [choiceId],
    }));
  };

  const handleMultiSelect = (optionId: string, choiceId: string, checked: boolean) => {
    setSelections((prev) => {
      const current = prev[optionId] || [];
      if (checked) {
        return {
          ...prev,
          [optionId]: [...current, choiceId],
        };
      } else {
        return {
          ...prev,
          [optionId]: current.filter((id) => id !== choiceId),
        };
      }
    });
  };

  const canConfirm = () => {
    if (!product.options) return true;
    
    for (const option of product.options) {
      if (option.required) {
        const selected = selections[option.id];
        if (!selected || selected.length === 0) {
          return false;
        }
      }
    }
    return true;
  };

  const calculateTotalPrice = () => {
    let total = product.basePrice;
    
    if (product.options) {
      product.options.forEach((option) => {
        const selectedChoiceIds = selections[option.id] || [];
        selectedChoiceIds.forEach((choiceId) => {
          const choice = option.choices.find((c) => c.id === choiceId);
          if (choice) {
            total += choice.priceModifier;
          }
        });
      });
    }
    
    return total;
  };

  const handleConfirm = () => {
    const selectedOptions: {
      optionName: string;
      choiceName: string;
      priceModifier: number;
    }[] = [];

    if (product.options) {
      product.options.forEach((option) => {
        const selectedChoiceIds = selections[option.id] || [];
        selectedChoiceIds.forEach((choiceId) => {
          const choice = option.choices.find((c) => c.id === choiceId);
          if (choice) {
            selectedOptions.push({
              optionName: option.name,
              choiceName: choice.name,
              priceModifier: choice.priceModifier,
            });
          }
        });
      });
    }

    onConfirm(selectedOptions);
    setSelections({});
  };

  const handleClose = () => {
    setSelections({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between">
            <div className="flex-1">
              <div>{product.name}</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Seçenekleri belirleyin
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Toplam</div>
              <div className="text-2xl font-bold font-tabular-nums text-primary">
                {formatCurrency(calculateTotalPrice())}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[50vh]">
          {product.options?.map((option) => (
            <div key={option.id} className="space-y-3 pb-4 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">{option.name}</Label>
                  {option.required && (
                    <Badge variant="destructive" className="text-xs">
                      Zorunlu
                    </Badge>
                  )}
                </div>
                {option.multiSelect && (
                  <Badge variant="secondary" className="text-xs">
                    Çoklu seçim
                  </Badge>
                )}
              </div>

              {option.multiSelect ? (
                <div className="space-y-2">
                  {option.choices.map((choice) => (
                    <div
                      key={choice.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`${option.id}-${choice.id}`}
                          checked={(selections[option.id] || []).includes(choice.id)}
                          onCheckedChange={(checked) =>
                            handleMultiSelect(option.id, choice.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`${option.id}-${choice.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {choice.name}
                        </Label>
                      </div>
                      {choice.priceModifier !== 0 && (
                        <Badge variant="outline" className="font-tabular-nums">
                          {choice.priceModifier > 0 ? '+' : ''}
                          {formatCurrency(choice.priceModifier)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={(selections[option.id] || [])[0] || ''}
                  onValueChange={(value) => handleSingleSelect(option.id, value)}
                >
                  <div className="space-y-2">
                    {option.choices.map((choice) => (
                      <div
                        key={choice.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value={choice.id}
                            id={`${option.id}-${choice.id}`}
                          />
                          <Label
                            htmlFor={`${option.id}-${choice.id}`}
                            className="cursor-pointer font-normal"
                          >
                            {choice.name}
                          </Label>
                        </div>
                        {choice.priceModifier !== 0 && (
                          <Badge variant="outline" className="font-tabular-nums">
                            {choice.priceModifier > 0 ? '+' : ''}
                            {formatCurrency(choice.priceModifier)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" weight="bold" />
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm()}>
            <Check className="h-4 w-4 mr-2" weight="bold" />
            Sepete Ekle ({formatCurrency(calculateTotalPrice())})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
