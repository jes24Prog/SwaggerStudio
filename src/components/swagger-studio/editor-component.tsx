
"use client"

import { useEffect, useRef, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { configureMonacoYaml } from 'monaco-yaml';
import { useStore } from '@/lib/store';
import { useDebounce } from '@/hooks/use-debounce';
import { parseAndValidate, formatSpec } from '@/lib/swagger-utils';
import { Loader2 } from 'lucide-react';
import { InputDialog } from './input-dialog';
import { useToast } from '@/hooks/use-toast';
import * as yaml from 'js-yaml';
import { get, set, unset } from 'lodash';

// Helper function to get path from position, since it's not exported from monaco-yaml anymore
function getPathFromPosition(content: string, position: monaco.Position): string[] | undefined {
  const lines = content.split('\n').slice(0, position.lineNumber);
  const path: string[] = [];
  let currentIndent = -1;

  const stack: { indent: number; path: string[] }[] = [{ indent: -1, path: [] }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S/);

    if (indent === -1) continue;

    const isListItem = line.trim().startsWith('-');

    while (indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const lastPath = stack[stack.length - 1].path;
    let newPathPart: string | null = null;
    
    if (i === position.lineNumber - 1) {
      // Current line
      if (isListItem) {
          // It's a list item, but what's its index?
          // We can't easily determine index on the fly, so we approximate
          // For code actions, this is tricky. Let's just find the key for now.
      }
      const keyMatch = line.slice(0, position.column - 1).match(/(?:\s*-\s*)?(\w+):/);
      if (keyMatch) {
          newPathPart = keyMatch[1];
      } else {
          // Not on a key, might be a value. Return path to parent.
          return lastPath;
      }
    } else {
       // Previous lines
       const keyMatch = line.match(/(?:\s*-\s*)?(\w+):/);
       if (keyMatch) {
           newPathPart = keyMatch[1];
       }
    }
    
    if (newPathPart) {
      const newPath = [...lastPath, newPathPart];
      stack.push({ indent, path: newPath });
    }
  }

  return stack[stack.length - 1].path;
}


export function EditorComponent() {
  const { spec, setSpec, setParsedSpec, setValidationErrors, setMissingSchemas, editorFormat } = useStore();
  const { theme } = useTheme();
  const monacoInstance = useMonaco();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { toast } = useToast();

  const [isExtractDialogOpen, setExtractDialogOpen] = useState(false);
  const [extractionArgs, setExtractionArgs] = useState<{ path: string[], range: monaco.IRange } | null>(null);


  const debouncedSpec = useDebounce(spec, 300);

  useEffect(() => {
    if (monacoInstance) {
      const yamlWorker = new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url));
      const editorWorker = new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      
      (window as any).MonacoEnvironment = {
        getWorker(_: any, label: string) {
          if (label === 'yaml') {
            return yamlWorker;
          }
          return editorWorker;
        }
      };

      configureMonacoYaml(monacoInstance, {
        enableSchemaRequest: true,
        schemas: [{
          uri: 'https://spec.openapis.org/oas/v3.1/schema/2022-10-07',
          fileMatch: ['*'],
        }],
      });

      // Register Code Action Provider
      const actionProvider = monacoInstance.languages.registerCodeActionProvider('yaml', {
        provideCodeActions: (model, range) => {
          try {
            const parsed = yaml.load(model.getValue()) as any;
            if (!parsed || typeof parsed !== 'object') return { actions: [], dispose: () => {} };

            const path = getPathFromPosition(model.getValue(), range.getStartPosition());
            if (!path || path.length === 0) return { actions: [], dispose: () => {} };

            const node = get(parsed, path);

            if (node && node.type === 'object' && node.properties && !node.$ref) {
              const action = {
                title: 'Extract to new schema',
                kind: 'refactor.extract',
                command: {
                  id: 'extract-schema',
                  title: 'Extract Schema',
                  arguments: [path, range]
                }
              };
              return { actions: [action], dispose: () => {} };
            }
          } catch(e) {
            // Ignore parsing errors while typing
          }
          return { actions: [], dispose: () => {} };
        }
      });

      const command = monacoInstance.editor.registerCommand('extract-schema', (_, path, range) => {
        setExtractionArgs({ path, range });
        setExtractDialogOpen(true);
      });
      
      return () => {
        actionProvider.dispose();
        command.dispose();
      }
    }
  }, [monacoInstance]);
  
  const handleExtractSchema = async (schemaName: string) => {
    if (!extractionArgs || !schemaName) return;

    try {
        const parsed = yaml.load(spec) as any;
        const objectToExtract = get(parsed, extractionArgs.path);
        
        // Define the new schema
        const schemaPath = parsed.components?.schemas ? ['components', 'schemas', schemaName] : ['definitions', schemaName];
        set(parsed, schemaPath, objectToExtract);

        // Replace the inline object with a $ref
        const refPath = parsed.components?.schemas ? `#/components/schemas/${schemaName}` : `#/definitions/${schemaName}`;
        const parentPath = extractionArgs.path.slice(0, -1);
        const key = extractionArgs.path[extractionArgs.path.length-1];
        const parent = parentPath.length > 0 ? get(parsed, parentPath) : parsed;
        parent[key] = { $ref: refPath };

        const newSpec = yaml.dump(parsed);
        const formatted = await formatSpec(newSpec, editorFormat);
        setSpec(formatted);
        toast({ title: 'Schema Extracted', description: `Created "${schemaName}" and updated the reference.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Extraction Failed', description: e.message });
    }
  };


  useEffect(() => {
    async function validate() {
      const { errors, parsed, missingSchemas } = await parseAndValidate(debouncedSpec);
      setValidationErrors(errors);
      setParsedSpec(parsed);
      setMissingSchemas(missingSchemas);
    }
    validate();
  }, [debouncedSpec, setParsedSpec, setValidationErrors, setMissingSchemas]);
  
  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;

    // This exposes a global function that the validation panel can call
    (window as any).goToMonacoLine = (path: string) => {
      const model = editor.getModel();
      if (!model || !path) return;
      
      const yamlPath = path.split('/').slice(1);
      // monaco-yaml's getPathFromPosition is for reverse mapping, we need to find position from path.
      // We'll iterate through lines to find the best match for the path.
      const lines = model.getLinesContent();
      let bestMatchLine = -1;
      let maxMatch = 0;
      
      let currentPathStack: { indent: number, key: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith('#')) continue;

          const indent = line.search(/\S/);
          const keyMatch = trimmedLine.match(/^([^:]+):/);
          if (keyMatch) {
              const key = keyMatch[1].trim();

              while (currentPathStack.length > 0 && currentPathStack[currentPathStack.length - 1].indent >= indent) {
                  currentPathStack.pop();
              }
              currentPathStack.push({ indent, key });
              
              const currentModelPath = currentPathStack.map(p => p.key);
              
              let matchCount = 0;
              for(let j = 0; j < Math.min(yamlPath.length, currentModelPath.length); j++) {
                if (yamlPath[j] === currentModelPath[j]) {
                  matchCount++;
                } else {
                  break;
                }
              }

              if (matchCount > maxMatch) {
                maxMatch = matchCount;
                bestMatchLine = i + 1;
              }

              if (matchCount === yamlPath.length) {
                bestMatchLine = i + 1;
                break; 
              }
          }
      }
      
      if (bestMatchLine !== -1) {
          editor.revealLineInCenter(bestMatchLine);
          editor.setPosition({ lineNumber: bestMatchLine, column: 1 });
          editor.focus();
      }
    };
  }

  return (
    <>
    <div className="h-full w-full font-code flex-1">
      <Editor
        height="100%"
        language={editorFormat}
        value={spec}
        onChange={(value) => setSpec(value || '')}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        loading={<Loader2 className="animate-spin" />}
        options={{
          minimap: { enabled: true },
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fontSize: 14,
          'semanticHighlighting.enabled': true,
          codeLens: true,
        }}
      />
    </div>
    <InputDialog
        isOpen={isExtractDialogOpen}
        onOpenChange={setExtractDialogOpen}
        title="Extract to New Schema"
        description="Enter a name for the new reusable schema."
        inputLabel="Schema Name"
        onConfirm={handleExtractSchema}
      />
    </>
  );
}
