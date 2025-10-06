import OpenAPISchemaValidator from 'openapi-schema-validator';
import * as yaml from 'js-yaml';
import prettier from 'prettier/standalone';
import * as prettierYaml from 'prettier/plugins/yaml';
import * as prettierEstree from 'prettier/plugins/estree';
import * as prettierBabel from "prettier/plugins/babel";

const validator = new OpenAPISchemaValidator({
  version: '3.1.0',
});

type MissingSchema = {
  path: string;
  schema: string;
};

function findMissingSchemas(spec: any, currentPath: string, definedSchemas: Set<string>): MissingSchema[] {
    if (!spec || typeof spec !== 'object') {
        return [];
    }

    let missing: MissingSchema[] = [];

    if (spec.$ref && typeof spec.$ref === 'string') {
        const refPrefix = '#/components/schemas/';
        if (spec.$ref.startsWith(refPrefix)) {
            const schemaName = spec.$ref.substring(refPrefix.length);
            if (!definedSchemas.has(schemaName)) {
                missing.push({ path: currentPath, schema: schemaName });
            }
        }
    }

    for (const key in spec) {
        if (Object.prototype.hasOwnProperty.call(spec, key)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            missing = missing.concat(findMissingSchemas(spec[key], newPath, definedSchemas));
        }
    }

    return missing;
}


export async function parseAndValidate(spec: string): Promise<{ errors: any[], parsed: object | null, missingSchemas: MissingSchema[] }> {
  try {
    const parsed = yaml.load(spec) as any;
    if (typeof parsed !== 'object' || parsed === null) {
      return { errors: [{ message: 'Spec is not a valid object.' }], parsed: null, missingSchemas: [] };
    }
    const validationResult = validator.validate(parsed);

    const definedSchemas = new Set(Object.keys(parsed?.components?.schemas || {}));
    const missingSchemas = findMissingSchemas(parsed, '', definedSchemas);

    return { errors: validationResult.errors, parsed, missingSchemas };
  } catch (e: any) {
    return { errors: [{ message: e.message || 'Invalid YAML/JSON format.' }], parsed: null, missingSchemas: [] };
  }
}

export async function formatSpec(spec: string): Promise<string> {
  try {
    // Try to format as YAML first
    return await prettier.format(spec, {
      parser: 'yaml',
      plugins: [prettierYaml],
      printWidth: 80,
    });
  } catch (error) {
    console.error("Formatting as YAML failed:", error);
    try {
        // Fallback to JSON formatting
        const parsed = yaml.load(spec);
        const jsonString = JSON.stringify(parsed, null, 2);
        return await prettier.format(jsonString, {
            parser: "json",
            plugins: [prettierBabel, prettierEstree],
            printWidth: 80,
        });
    } catch(jsonError) {
        throw new Error("Could not format content. It might be invalid YAML or JSON.");
    }
  }
}

export function downloadFile(content: string, filename: string, type: 'yaml' | 'json') {
  let blob;
  let finalContent = content;
  if (type === 'json') {
    try {
      const parsed = yaml.load(content);
      finalContent = JSON.stringify(parsed, null, 2);
      blob = new Blob([finalContent], { type: 'application/json' });
    } catch (e) {
      console.error("Error converting to JSON", e);
      return;
    }
  } else {
    blob = new Blob([content], { type: 'application/x-yaml' });
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
