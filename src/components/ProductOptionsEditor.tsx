import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, CaretUp, CaretDown } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import type { ProductOption, ProductOptionChoice } from '@/lib/types';
import { generateId } from '@/lib/helpers';
import { formatCurrency } from '@/lib/helpers';

interface ProductOptionsEditorProps {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
}

export default function ProductOptionsEditor({ options, onChange }: ProductOptionsEditorProps) {
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const addOption = () => {
    const newOption: ProductOption = {
      id: generateId(),
      name: '',
      choices: [],
      required: false,
      multiSelect: false,
    };
    onChange([...options, newOption]);
    setExpandedOptionId(newOption.id);
  };

  const removeOption = (optionId: string) => {
    onChange(options.filter(opt => opt.id !== optionId));
    if (expandedOptionId === optionId) {
      setExpandedOptionId(null);
    }
  };

  const updateOption = (optionId: string, updates: Partial<ProductOption>) => {
    onChange(
      options.map(opt => (opt.id === optionId ? { ...opt, ...updates } : opt))
    );
  };

  const addChoice = (optionId: string) => {
    const newChoice: ProductOptionChoice = {
      id: generateId(),
      name: '',
      priceModifier: 0,
    };
    onChange(
      options.map(opt =>
        opt.id === optionId
          ? { ...opt, choices: [...opt.choices, newChoice] }
          : opt
      )
    );
  };

  const removeChoice = (optionId: string, choiceId: string) => {
    onChange(
      options.map(opt =>
        opt.id === optionId
          ? { ...opt, choices: opt.choices.filter(c => c.id !== choiceId) }
          : opt
      )
    );
  };

  const updateChoice = (
    optionId: string,
    choiceId: string,
    updates: Partial<ProductOptionChoice>
  ) => {
    onChange(
      options.map(opt =>
        opt.id === optionId
          ? {
              ...opt,
              choices: opt.choices.map(c =>
                c.id === choiceId ? { ...c, ...updates } : c
              ),
            }
          : opt
      )
    );
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOptions.length) return;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    onChange(newOptions);
  };

  const toggleExpand = (optionId: string) => {
    setExpandedOptionId(expandedOptionId === optionId ? null : optionId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Ürün Seçenekleri</h4>
          <p className="text-xs text-muted-foreground">
            Müşterilerin seçebileceği varyantlar ve ek özellikler tanımlayın
          </p>
        </div>
        <Button onClick={addOption} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" weight="bold" />
          Yeni Seçenek
        </Button>
      </div>

      {options.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Henüz seçenek eklenmemiş
            </p>
            <p className="text-xs text-muted-foreground">
              Örnek: Kahve şekeri, Pizza boyutu, Ek malzeme
            </p>
          </CardContent>
        </Card>
      )}

      {options.map((option, index) => (
        <Card key={option.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Seçenek adı (ör: Şeker Durumu, Pizza Boyutu)"
                    value={option.name}
                    onChange={(e) =>
                      updateOption(option.id, { name: e.target.value })
                    }
                    className="font-medium"
                  />
                  {option.choices.length > 0 && (
                    <Badge variant="secondary">
                      {option.choices.length} seçim
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={option.required}
                      onCheckedChange={(checked) =>
                        updateOption(option.id, { required: checked })
                      }
                      id={`required-${option.id}`}
                    />
                    <Label
                      htmlFor={`required-${option.id}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      Zorunlu
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={option.multiSelect}
                      onCheckedChange={(checked) =>
                        updateOption(option.id, { multiSelect: checked })
                      }
                      id={`multi-${option.id}`}
                    />
                    <Label
                      htmlFor={`multi-${option.id}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      Çoklu seçim
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveOption(index, 'up')}
                  disabled={index === 0}
                >
                  <CaretUp className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveOption(index, 'down')}
                  disabled={index === options.length - 1}
                >
                  <CaretDown className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(option.id)}
                >
                  {expandedOptionId === option.id ? 'Daralt' : 'Genişlet'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  <Trash className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedOptionId === option.id && (
            <>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Seçimler</Label>
                  <Button
                    onClick={() => addChoice(option.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" weight="bold" />
                    Seçim Ekle
                  </Button>
                </div>

                {option.choices.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Seçim eklenmemiş. Örnek: Sade, Orta Şekerli, Şekerli
                  </p>
                )}

                {option.choices.map((choice) => (
                  <div
                    key={choice.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
                  >
                    <Input
                      placeholder="Seçim adı"
                      value={choice.name}
                      onChange={(e) =>
                        updateChoice(option.id, choice.id, {
                          name: e.target.value,
                        })
                      }
                      className="flex-1 h-8 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        value={choice.priceModifier || ''}
                        onChange={(e) =>
                          updateChoice(option.id, choice.id, {
                            priceModifier: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 h-8 text-sm"
                        step="0.01"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ₺ ek
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(option.id, choice.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="h-3 w-3" weight="bold" />
                    </Button>
                  </div>
                ))}

                {option.choices.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2">
                    <strong>Önizleme:</strong>{' '}
                    {option.choices
                      .map(
                        (c) =>
                          `${c.name}${
                            c.priceModifier !== 0
                              ? ` (${c.priceModifier > 0 ? '+' : ''}${formatCurrency(c.priceModifier)})`
                              : ''
                          }`
                      )
                      .join(', ')}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
