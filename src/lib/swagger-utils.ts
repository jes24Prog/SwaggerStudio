import OpenAPISchemaValidator from 'openapi-schema-validator';
import * as yaml from 'js-yaml';
import prettier from 'prettier/standalone';
import * as prettierYaml from 'prettier/plugins/yaml';
import * as prettierEstree from 'prettier/plugins/estree';
import * as prettierBabel from "prettier/plugins/babel";

const validator = new OpenAPISchemaValidator({
  version: '3.1.0',
});

export async function parseAndValidate(spec: string): Promise<{ errors: any[], parsed: object | null }> {
  try {
    const parsed = yaml.load(spec) as object;
    if (typeof parsed !== 'object' || parsed === null) {
      return { errors: [{ message: 'Spec is not a valid object.' }], parsed: null };
    }
    const validationResult = validator.validate(parsed);
    return { errors: validationResult.errors, parsed };
  } catch (e: any) {
    return { errors: [{ message: e.message || 'Invalid YAML/JSON format.' }], parsed: null };
  }
}

export async function formatSpec(spec: string): Promise<string> {
  try {
    const parsed = yaml.load(spec);
    // Formatting as YAML as it's the more common format for OpenAPI
    return await prettier.format(spec, {
      parser: 'yaml',
      plugins: [prettierYaml],
      printWidth: 80,
    });
  } catch (error) {
    console.error("Formatting failed:", error);
    try {
        // Try to format as JSON as a fallback
        return await prettier.format(spec, {
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
