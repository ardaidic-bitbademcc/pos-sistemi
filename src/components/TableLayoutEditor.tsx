import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as TableIcon, Trash, ArrowsOutCardinal, Circle, Square, Rectangle } from '@phosphor-icons/react';
import type { Table, TableSection } from '@/lib/types';
import { toast } from 'sonner';

interface TableLayoutEditorProps {
  tables: Table[];
  sections: TableSection[];
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void;
  onAutoArrange: () => void;
}

export default function TableLayoutEditor({ 
  tables, 
  sections,
  onUpdateTable,
  onAutoArrange 
}: TableLayoutEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingTable, setResizingTable] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  const GRID_SIZE = 20;
  const DEFAULT_TABLE_SIZE = 80;

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const filteredTables = selectedSection === 'all' 
    ? tables 
    : tables.filter(t => t.sectionId === selectedSection);

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, tableId: string) => {
    e.preventDefault();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = table.layoutX ?? 0;
    const currentY = table.layoutY ?? 0;

    setDragOffset({
      x: clientX - rect.left - currentX * scale,
      y: clientY - rect.top - currentY * scale,
    });

    setDraggedTable(tableId);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTable || !canvasRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - dragOffset.x) / scale;
    const y = (clientY - rect.top - dragOffset.y) / scale;

    const snappedX = Math.max(0, Math.min(snapToGrid(x), canvasSize.width / scale - DEFAULT_TABLE_SIZE));
    const snappedY = Math.max(0, Math.min(snapToGrid(y), canvasSize.height / scale - DEFAULT_TABLE_SIZE));

    onUpdateTable(draggedTable, {
      layoutX: snappedX,
      layoutY: snappedY,
    });
  };

  const handleDragEnd = () => {
    if (draggedTable) {
      toast.success('Masa konumu güncellendi');
      setDraggedTable(null);
    }
  };

  const handleShapeChange = (tableId: string, shape: 'square' | 'rectangle' | 'circle') => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    let width = DEFAULT_TABLE_SIZE;
    let height = DEFAULT_TABLE_SIZE;

    if (shape === 'rectangle') {
      width = DEFAULT_TABLE_SIZE * 1.5;
      height = DEFAULT_TABLE_SIZE;
    }

    onUpdateTable(tableId, {
      layoutShape: shape,
      layoutWidth: width,
      layoutHeight: height,
    });

    toast.success('Masa şekli güncellendi');
  };

  const handleAutoArrangeClick = () => {
    onAutoArrange();
    toast.success('Masalar otomatik düzenlendi');
  };

  const getSectionColor = (table: Table) => {
    if (!table.sectionId) return '#6B7280';
    const section = sections.find(s => s.id === table.sectionId);
    return section?.color || '#6B7280';
  };

  const renderTable = (table: Table) => {
    const x = table.layoutX ?? 0;
    const y = table.layoutY ?? 0;
    const width = table.layoutWidth ?? DEFAULT_TABLE_SIZE;
    const height = table.layoutHeight ?? DEFAULT_TABLE_SIZE;
    const shape = table.layoutShape || 'square';
    const color = getSectionColor(table);
    const isDragging = draggedTable === table.id;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: color,
      cursor: 'move',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '4px',
      boxShadow: isDragging ? '0 10px 25px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      zIndex: isDragging ? 1000 : 1,
      opacity: table.isActive ? 1 : 0.5,
      border: '2px solid rgba(255,255,255,0.3)',
    };

    if (shape === 'circle') {
      baseStyle.borderRadius = '50%';
    } else if (shape === 'square') {
      baseStyle.borderRadius = '12px';
    } else {
      baseStyle.borderRadius = '8px';
    }

    return (
      <div
        key={table.id}
        style={baseStyle}
        onMouseDown={(e) => handleDragStart(e, table.id)}
        onTouchStart={(e) => handleDragStart(e, table.id)}
      >
        <div className="text-white font-bold text-lg select-none">
          {table.tableNumber}
        </div>
        <div className="text-white/80 text-xs select-none">
          {table.capacity} kişi
        </div>
        
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border border-border rounded-md shadow-md px-2 py-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto z-10">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => handleShapeChange(table.id, 'square')}
            title="Kare"
          >
            <Square className="h-3 w-3" weight={shape === 'square' ? 'fill' : 'regular'} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => handleShapeChange(table.id, 'rectangle')}
            title="Dikdörtgen"
          >
            <Rectangle className="h-3 w-3" weight={shape === 'rectangle' ? 'fill' : 'regular'} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => handleShapeChange(table.id, 'circle')}
            title="Daire"
          >
            <Circle className="h-3 w-3" weight={shape === 'circle' ? 'fill' : 'regular'} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TableIcon className="h-5 w-5" weight="fill" />
              Masa Yerleşim Planı
            </CardTitle>
            <CardDescription>
              Masalarınızı sürükleyerek salon düzeninizi oluşturun
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tüm Bölgeler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölgeler</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: section.color }}
                      />
                      {section.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAutoArrangeClick}
            >
              <ArrowsOutCardinal className="h-4 w-4 mr-2" />
              Otomatik Düzenle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <TableIcon className="h-3 w-3" />
              {filteredTables.length} masa
            </Badge>
            <span>•</span>
            <span>Masaları sürükleyerek yerleştirin</span>
            <span>•</span>
            <span>Şekil değiştirmek için üzerine gelin</span>
          </div>

          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-border rounded-lg bg-muted/20 overflow-hidden"
            style={{
              height: '600px',
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDrag}
            onTouchEnd={handleDragEnd}
          >
            {filteredTables.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <TableIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {selectedSection === 'all' 
                      ? 'Henüz masa yok. Masa Yönetimi sekmesinden masa ekleyin.'
                      : 'Bu bölgede masa yok.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredTables.map(renderTable)
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm text-muted-foreground">Bölge Renkleri:</div>
            {sections.filter(s => filteredTables.some(t => t.sectionId === s.id)).map((section) => (
              <div key={section.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: section.color }}
                />
                <span className="text-sm">{section.name}</span>
              </div>
            ))}
            {filteredTables.some(t => !t.sectionId) && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-border bg-gray-500" />
                <span className="text-sm">Bölgesiz</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
