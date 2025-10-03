'use server';

import { getRawSchemas } from './openapi-parser';
import { generateJavaCode } from './java-generator';
import type { GenerationOptions, GeneratedCode } from './types';

export async function generateCodeAction(
  specContent: string,
  options: GenerationOptions,
  selectedSchemaNames: string[]
): Promise<GeneratedCode[]> {
  try {
    const allSchemas = getRawSchemas(specContent);
    const generatedCode: GeneratedCode[] = [];
    const processed = new Set<string>();

    const generateForSchema = (schemaName: string) => {
        if (!schemaName || processed.has(schemaName)) return;

        const schema = allSchemas[schemaName];
        if(!schema) return;
        
        processed.add(schemaName);
        
        const processRef = (ref: string) => {
            if (ref) {
                const refName = ref.split('/').pop();
                if (refName) {
                    generateForSchema(refName);
                }
            }
        };

        // Recursively generate for dependencies
        if (schema.properties) {
            Object.values(schema.properties).forEach((prop: any) => {
                if(prop.$ref) {
                    processRef(prop.$ref);
                } else if (prop.type === 'array' && prop.items?.$ref) {
                    processRef(prop.items.$ref);
                }
            });
        }
        if (schema.allOf) {
             schema.allOf.forEach((item: any) => {
                if(item.$ref) {
                    processRef(item.$ref);
                } else if (item.properties) { // Handle inline objects in allOf
                    Object.values(item.properties).forEach((prop: any) => {
                        if (prop.$ref) {
                            processRef(prop.$ref);
                        } else if (prop.type === 'array' && prop.items?.$ref) {
                            processRef(prop.items.$ref);
                        }
                    });
                }
            });
        }
        
        const code = generateJavaCode(schemaName, allSchemas, options);
        generatedCode.push({ name: schemaName, code });
    }

    selectedSchemaNames.forEach(name => generateForSchema(name));
    
    return generatedCode.sort((a,b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
        return [{ name: "Error", code: `// Generation failed: ${e.message}` }];
    }
    return [{ name: "Error", code: "// An unknown error occurred during code generation." }];
  }
}
