'use client';

import { useState, type DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onSpecLoad: (content: string, fileName: string) => void;
  isLoading: boolean;
}

export default function FileUploader({ onSpecLoad, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onSpecLoad(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim()) {
      onSpecLoad(pastedText, 'pasted-spec.json');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">1. Provide OpenAPI Spec</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="paste">
              <FileText className="mr-2 h-4 w-4" /> Paste
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors',
                dragActive ? 'border-primary bg-primary/10' : 'border-border'
              )}
            >
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                <label htmlFor="file-upload" className="font-semibold text-primary cursor-pointer hover:underline">
                  Click to upload
                </label>{' '}
                or drag and drop.
              </p>
              <p className="text-xs text-muted-foreground">JSON or YAML</p>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".json,.yaml,.yml"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                disabled={isLoading}
              />
            </div>
          </TabsContent>
          <TabsContent value="paste" className="mt-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Paste your OpenAPI/Swagger JSON or YAML here"
                className="h-40 font-code text-xs"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={handlePasteSubmit} disabled={isLoading || !pastedText.trim()} className="w-full">
                Use Pasted Content
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
