'use client';

import { useState, useTransition } from 'react';
import FileUploader from './file-uploader';
import ConfigurationPanel from './configuration-panel';
import SchemaList from './schema-list';
import CodePreview from './code-preview';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { parseSpec } from '@/lib/openapi-parser';
import { generateCodeAction } from '@/lib/actions';
import type { GenerationOptions, Schema, GeneratedCode } from '@/lib/types';
import { Logo } from './icons/logo';
import { Wand2 } from 'lucide-react';

export default function PageClient() {
  const [specContent, setSpecContent] = useState('');
  const [fileName, setFileName] = useState('openapi.json');
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([]);
  const [options, setOptions] = useState<GenerationOptions>({
    packageName: 'com.generated.models',
    useLombok: true,
    useJackson: true,
    dateType: 'OffsetDateTime',
    useBoxedPrimitives: true,
    generateHelpers: true,
    useOptional: false,
    enumType: 'enum',
    useValidationAnnotations: true,
    validationApi: 'jakarta',
  });

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSpecLoad = (content: string, name: string) => {
    setSpecContent(content);
    setFileName(name);
    try {
      const parsedSchemas = parseSpec(content);
      setSchemas(parsedSchemas);
      setSelectedSchemas([]);
      setGeneratedCode([]);
      toast({ title: 'Spec loaded successfully!', description: `Found ${parsedSchemas.length} models in ${name}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ variant: 'destructive', title: 'Failed to parse spec', description: message });
      setSchemas([]);
    }
  };
  
  const handleGenerate = () => {
    if (selectedSchemas.length === 0) {
      toast({ variant: 'destructive', title: 'No models selected', description: 'Please select at least one model to generate.' });
      return;
    }
    startTransition(async () => {
      const result = await generateCodeAction(specContent, options, selectedSchemas);
      if (result.length > 0 && result[0].name === "Error") {
          toast({ variant: 'destructive', title: 'Generation Failed', description: result[0].code.substring(20) });
          setGeneratedCode([]);
      } else {
          setGeneratedCode(result);
          toast({ title: 'Code generated!', description: `Successfully generated ${result.length} Java classes.` });
      }
    });
  };

  const handleCodeChange = (name: string, newCode: string) => {
    setGeneratedCode(prev => prev.map(g => g.name === name ? { ...g, code: newCode } : g));
  };

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur">
          <a className="flex items-center justify-center" href="#">
            <Logo className="h-6 w-6 text-primary" />
            <span className="ml-2 font-headline text-xl font-bold tracking-tight">Schema2Java</span>
          </a>
       </header>

       <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
                <div className="flex flex-col gap-8">
                    <FileUploader onSpecLoad={handleSpecLoad} isLoading={isPending} />
                    <ConfigurationPanel options={options} setOptions={setOptions} isLoading={isPending} />
                    <SchemaList schemas={schemas} selectedSchemas={selectedSchemas} onSelectionChange={setSelectedSchemas} isLoading={isPending} />
                     <Button onClick={handleGenerate} disabled={isPending || selectedSchemas.length === 0} size="lg">
                        <Wand2 className="mr-2 h-5 w-5" />
                        {isPending ? 'Generating...' : `Generate ${selectedSchemas.length} Models`}
                    </Button>
                </div>
                <div className="lg:sticky top-24 self-start h-[calc(100vh-8rem)]">
                    <CodePreview
                        generatedCode={generatedCode}
                        onCodeChange={handleCodeChange}
                        isLoading={isPending}
                        fileName={fileName}
                    />
                </div>
            </div>
       </main>
    </div>
  );
}
