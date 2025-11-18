import { useState } from 'react';
import { useData } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestItem {
  id: string;
  name: string;
  value: string;
  createdAt: string;
}

export default function StorageTest() {
  const [items, setItems] = useData<TestItem[]>('test-items', []);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  const storageMode = import.meta.env.VITE_STORAGE_MODE || 'kv';

  const addItem = () => {
    if (!newName || !newValue) return;

    const newItem: TestItem = {
      id: `test-${Date.now()}`,
      name: newName,
      value: newValue,
      createdAt: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    setNewName('');
    setNewValue('');
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Storage Adapter Test</CardTitle>
          <CardDescription>
            Current Mode: <strong className="text-primary">{storageMode.toUpperCase()}</strong>
            {storageMode === 'kv' && ' (localStorage)'}
            {storageMode === 'supabase' && ' ☁️ (Cloud Database)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Form */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="flex-1">
                <Label>Value</Label>
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter value"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addItem}>Add Item</Button>
              </div>
            </div>

            {/* Items List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                Items ({items.length})
              </h3>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No items yet. Add one above!
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">📋 Test Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Add some items above (currently using {storageMode})</li>
                <li>Refresh the page - items should persist</li>
                <li>
                  To test Supabase: Update <code className="bg-background px-1 rounded">.env</code>
                  {' '}and set{' '}
                  <code className="bg-background px-1 rounded">VITE_STORAGE_MODE=supabase</code>
                </li>
                <li>Restart dev server: <code className="bg-background px-1 rounded">npm run dev</code></li>
                <li>Items should now sync to Supabase!</li>
                <li>Open another browser tab - changes sync in real-time</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
