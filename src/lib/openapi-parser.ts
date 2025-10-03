import yaml from 'js-yaml';
import { Schema } from '@/lib/types';

const getSchemas = (spec: any): [any, string[]] => {
  if (spec.swagger) { // OpenAPI 2.0
    return [spec.definitions, Object.keys(spec.definitions || {})];
  }
  if (spec.openapi) { // OpenAPI 3.0
    return [spec.components?.schemas, Object.keys(spec.components?.schemas || {})];
  }
  return [{}, []];
};

const getPropertyType = (prop: any, spec: any): string => {
  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop() || '';
    return refName;
  }
  if (prop.type === 'array') {
    const itemType = getPropertyType(prop.items, spec);
    return `List<${itemType}>`;
  }
  if (prop.type === 'string' && prop.enum) {
    return 'enum';
  }
  if (prop.format === 'int64') return 'long';
  return prop.type || 'Object';
};

export const parseSpec = (content: string): Schema[] => {
  try {
    const spec = yaml.load(content) as any;
    if (!spec || (typeof spec !== 'object')) {
        throw new Error("Invalid OpenAPI/Swagger spec");
    }

    const [schemas, schemaNames] = getSchemas(spec);
    
    if (!schemas) return [];

    return schemaNames.map(name => {
      const schema = schemas[name];
      const properties = schema.properties ? Object.keys(schema.properties).map(propName => {
        const prop = schema.properties[propName];
        return {
          name: propName,
          type: getPropertyType(prop, spec),
          required: schema.required ? schema.required.includes(propName) : false,
        };
      }) : [];

      return {
        name,
        description: schema.description,
        properties,
      };
    });
  } catch (error) {
    console.error("Error parsing spec:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to parse spec: ${error.message}`);
    }
    throw new Error("An unknown error occurred while parsing the spec.");
  }
};

export const getRawSchemas = (content: string): { [key: string]: any } => {
    const spec = yaml.load(content) as any;
    if (!spec || typeof spec !== 'object') throw new Error("Invalid spec");
    const [schemas] = getSchemas(spec);
    return schemas;
}
