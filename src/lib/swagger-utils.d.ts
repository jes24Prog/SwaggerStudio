
import { ValidationError } from 'openapi-schema-validator';

export type EditorFormat = 'yaml' | 'json';

export type MissingSchema = {
  path: string;
  schema: string;
};

export function parseAndValidate(spec: string): Promise<{ errors: any[], parsed: object | null, missingSchemas: MissingSchema[] }>;
export function formatSpec(spec: string, format?: EditorFormat): Promise<string>;
export function downloadFile(content: string, filename: string, type: 'yaml' | 'json'): void;
export function convertSpec(spec: string, targetFormat: EditorFormat): string;
