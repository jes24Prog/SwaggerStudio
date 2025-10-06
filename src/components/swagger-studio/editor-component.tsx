"use client"

import { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { configureMonacoYaml, getPathFromPosition } from 'monaco-yaml';
import { useStore } from '@/lib/store';
import { useDebounce } from '@/hooks/use-debounce';
import { parseAndValidate } from '@/lib/swagger-utils';
import { Loader2 } from 'lucide-react';

export function EditorComponent() {
  const { spec, setSpec, setParsedSpec, setValidationErrors, setMissingSchemas } = useStore();
  const { theme } = useTheme();
  const monacoInstance = useMonaco();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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
    }
  }, [monacoInstance]);
  
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
    <div className="h-full w-full font-code">
      <Editor
        height="100%"
        language="yaml"
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
        }}
      />
    </div>
  );
}
