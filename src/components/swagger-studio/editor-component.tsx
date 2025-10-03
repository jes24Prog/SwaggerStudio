"use client"

import { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { configureMonacoYaml } from 'monaco-yaml';
import { useStore } from '@/lib/store';
import { useDebounce } from '@/hooks/use-debounce';
import { parseAndValidate } from '@/lib/swagger-utils';
import { Loader2 } from 'lucide-react';

export function EditorComponent() {
  const { spec, setSpec, setParsedSpec, setValidationErrors } = useStore();
  const { theme } = useTheme();
  const monacoInstance = useMonaco();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const debouncedSpec = useDebounce(spec, 300);

  useEffect(() => {
    if (monacoInstance) {
      // The yaml worker is required for `monaco-yaml`
      const yamlWorker = new Worker(
        new URL('monaco-yaml/yaml.worker', import.meta.url)
      );
      // The editor worker is required for the editor
      const editorWorker = new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url)
      );

      // @ts-ignore
      window.MonacoEnvironment = {
        getWorker(workerId, label) {
          if (label === 'yaml') {
            return yamlWorker;
          }
          return editorWorker;
        },
      };

      // Setup monaco-yaml
      configureMonacoYaml(monacoInstance, {
        enableSchemaRequest: true,
        schemas: [
          {
            uri: 'https://spec.openapis.org/oas/v3.1/schema/2022-10-07',
            fileMatch: ['*'],
          },
        ],
      });
    }
  }, [monacoInstance]);
  
  useEffect(() => {
    async function validate() {
      const { errors, parsed } = await parseAndValidate(debouncedSpec);
      setValidationErrors(errors);
      setParsedSpec(parsed);
    }
    validate();
  }, [debouncedSpec, setParsedSpec, setValidationErrors]);

  function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
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
