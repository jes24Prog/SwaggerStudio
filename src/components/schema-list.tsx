'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Schema } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface SchemaListProps {
  schemas: Schema[];
  selectedSchemas: string[];
  onSelectionChange: (selected: string[]) => void;
  isLoading: boolean;
}

export default function SchemaList({ schemas, selectedSchemas, onSelectionChange, isLoading }: SchemaListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchemas = useMemo(() => {
    return schemas.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [schemas, searchTerm]);

  const handleSelectAll = () => {
    onSelectionChange(filteredSchemas.map(s => s.name));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleSchemaToggle = (schemaName: string) => {
    const newSelection = selectedSchemas.includes(schemaName)
      ? selectedSchemas.filter(s => s !== schemaName)
      : [...selectedSchemas, schemaName];
    onSelectionChange(newSelection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">3. Select Models</CardTitle>
        {schemas.length > 0 && <CardDescription>{schemas.length} models found</CardDescription>}
      </CardHeader>
      <CardContent>
        {schemas.length > 0 ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSelectAll} size="sm" variant="outline" disabled={isLoading}>Select All Visible</Button>
              <Button onClick={handleDeselectAll} size="sm" variant="outline" disabled={isLoading}>Deselect All</Button>
            </div>
            <Separator />
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {filteredSchemas.map(schema => (
                  <div key={schema.name} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={schema.name}
                      checked={selectedSchemas.includes(schema.name)}
                      onCheckedChange={() => handleSchemaToggle(schema.name)}
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor={schema.name} className="text-sm font-medium cursor-pointer">
                        {schema.name}
                      </label>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {schema.description || 'No description available.'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {schema.properties.slice(0,5).map(prop => (
                            <Badge key={prop.name} variant="secondary">{prop.name}: {prop.type}</Badge>
                        ))}
                        {schema.properties.length > 5 && <Badge variant="secondary">...</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>Upload a spec to see available models.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
