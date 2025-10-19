
import OpenAPISchemaValidator from 'openapi-schema-validator';
import * as yaml from 'js-yaml';
import prettier from 'prettier/standalone';
import * as prettierYaml from 'prettier/plugins/yaml';
import * as prettierEstree from 'prettier/plugins/estree';
import * as prettierBabel from "prettier/plugins/babel";

const validator = new OpenAPISchemaValidator({
  version: '3.1.0',
});

export type EditorFormat = 'yaml' | 'json';

type MissingSchema = {
  path: string;
  schema: string;
};

function findMissingSchemas(spec: any, currentPath: string, definedSchemas: Set<string>): MissingSchema[] {
    if (!spec || typeof spec !== 'object') {
        return [];
    }

    let missing: MissingSchema[] = [];
    const refPrefixOAS3 = '#/components/schemas/';
    const refPrefixOAS2 = '#/definitions/';

    if (spec.$ref && typeof spec.$ref === 'string') {
        let schemaName: string | null = null;
        if (spec.$ref.startsWith(refPrefixOAS3)) {
            schemaName = spec.$ref.substring(refPrefixOAS3.length);
        } else if (spec.$ref.startsWith(refPrefixOAS2)) {
            schemaName = spec.$ref.substring(refPrefixOAS2.length);
        }
        
        if (schemaName && !definedSchemas.has(schemaName)) {
            missing.push({ path: currentPath.replace(/.?\$ref$/, ''), schema: schemaName });
        }
    }

    for (const key in spec) {
        if (Object.prototype.hasOwnProperty.call(spec, key)) {
            const newPath = currentPath ? `${currentPath}/${key}` : key;
            missing = missing.concat(findMissingSchemas(spec[key], newPath, definedSchemas));
        }
    }
    
    // Remove duplicates by creating a unique key for each missing schema
    const uniqueMissing = new Map<string, MissingSchema>();
    missing.forEach(item => {
        const uniqueKey = `${item.path}-${item.schema}`;
        if (!uniqueMissing.has(uniqueKey)) {
            uniqueMissing.set(uniqueKey, item);
        }
    });

    return Array.from(uniqueMissing.values());
}


export async function parseAndValidate(spec: string): Promise<{ errors: any[], parsed: object | null, missingSchemas: MissingSchema[] }> {
  try {
    const parsed = yaml.load(spec) as any;
    if (typeof parsed !== 'object' || parsed === null) {
      return { errors: [{ message: 'Spec is not a valid object.' }], parsed: null, missingSchemas: [] };
    }
    const validationResult = validator.validate(parsed);

    const definedSchemas = new Set(Object.keys(parsed?.components?.schemas || parsed?.definitions || {}));
    const missingSchemas = findMissingSchemas(parsed, '', definedSchemas);

    return { errors: validationResult.errors, parsed, missingSchemas };
  } catch (e: any) {
    return { errors: [{ message: e.message || 'Invalid YAML/JSON format.' }], parsed: null, missingSchemas: [] };
  }
}

export async function formatSpec(spec: string, format: EditorFormat = 'yaml'): Promise<string> {
  try {
    const parser = format === 'yaml' ? 'yaml' : 'json-stringify';
    const plugins = format === 'yaml' ? [prettierYaml] : [prettierBabel, prettierEstree];
    
    return await prettier.format(spec, {
      parser,
      plugins,
      printWidth: 80,
    });
  } catch (error) {
    console.error(`Formatting as ${format} failed:`, error);
    // Try to convert first, then format. This can fix some issues.
    try {
        const parsed = yaml.load(spec);
        const content = format === 'yaml' ? yaml.dump(parsed) : JSON.stringify(parsed);
         return await prettier.format(content, {
            parser,
            plugins,
            printWidth: 80,
        });
    } catch (e) {
      throw new Error(`Could not format content. It might be invalid ${format.toUpperCase()}.`);
    }
  }
}

export function downloadFile(content: string, filename: string, type: 'yaml' | 'json') {
  let blob;
  let finalContent = content;

  try {
    const parsed = yaml.load(content);
    if (type === 'json') {
      finalContent = JSON.stringify(parsed, null, 2);
      blob = new Blob([finalContent], { type: 'application/json' });
    } else {
      finalContent = yaml.dump(parsed);
      blob = new Blob([finalContent], { type: 'application/x-yaml' });
    }
  } catch (e) {
    console.error(`Error converting to ${type}`, e);
    // If conversion fails, download the raw content
    const mimeType = type === 'json' ? 'application/json' : 'application/x-yaml';
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function convertSpec(spec: string, targetFormat: EditorFormat): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const parsed = yaml.load(spec);
        if (typeof parsed !== 'object' || parsed === null) {
          // Not a valid object, return as-is
          resolve(spec);
          return;
        }

        if (targetFormat === 'json') {
          resolve(JSON.stringify(parsed, null, 2));
        } else {
          resolve(yaml.dump(parsed));
        }
      } catch (e: any) {
        console.error("Conversion error:", e);
        reject(new Error("Failed to convert the specification. The content may be invalid."));
      }
    }, 10); // Use a small timeout to unblock the UI thread
  });
}
