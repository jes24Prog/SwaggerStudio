'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, FileArchive, Check } from 'lucide-react';
import type { GeneratedCode } from '@/lib/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import Editor from '@monaco-editor/react';

interface CodePreviewProps {
  generatedCode: GeneratedCode[];
  onCodeChange: (name: string, newCode: string) => void;
  isLoading: boolean;
  fileName: string;
}

export default function CodePreview({ generatedCode, onCodeChange, isLoading, fileName }: CodePreviewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (generatedCode.length > 0 && !activeTab) {
      setActiveTab(generatedCode[0].name);
    } else if (generatedCode.length > 0 && !generatedCode.find(g => g.name === activeTab)) {
      setActiveTab(generatedCode[0].name);
    } else if (generatedCode.length === 0) {
      setActiveTab(undefined);
    }
  }, [generatedCode, activeTab]);

  const handleCopy = (name: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(name);
    toast({ title: 'Copied to clipboard!', description: `${name}.java` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (name: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${name}.java`);
    toast({ title: 'Download started!', description: `${name}.java` });
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    generatedCode.forEach(({ name, code }) => {
      zip.file(`${name}.java`, code);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFileName = fileName.replace(/\.(json|yaml|yml)$/, '') + '-models.zip';
    saveAs(zipBlob, zipFileName);
    toast({ title: 'Exporting ZIP!', description: `Generated ${generatedCode.length} files.` });
  };
  
  const currentCode = generatedCode.find(g => g.name === activeTab)?.code || '';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-lg">4. Generated Code</CardTitle>
                <CardDescription>
                    {generatedCode.length > 0 ? `${generatedCode.length} classes generated` : 'Select models and click generate'}
                </CardDescription>
            </div>
            {generatedCode.length > 0 && (
                <Button onClick={handleExportZip} disabled={isLoading}>
                    <FileArchive className="mr-2 h-4 w-4" />
                    Export ZIP
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {isLoading ? (
          <div className="space-y-4 flex-grow">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-full flex-grow" />
          </div>
        ) : generatedCode.length > 0 && activeTab ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
            <div className="flex justify-between items-center border-b">
              <ScrollArea className="w-full whitespace-nowrap">
                <TabsList>
                {generatedCode.map(({ name }) => (
                    <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
                ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
                <div className="flex items-center gap-2 p-1 ml-2">
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(activeTab, currentCode)}>
                        {copied === activeTab ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(activeTab, currentCode)}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {generatedCode.map(({ name, code }) => (
                <TabsContent key={name} value={name} className="flex-grow mt-0 rounded-lg overflow-hidden">
                    <Editor
                      height="100%"
                      language="java"
                      value={code}
                      onChange={(value) => onCodeChange(name, value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground border rounded-lg bg-muted/50">
            <p>Generated code will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
