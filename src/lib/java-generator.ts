import type { GenerationOptions } from './types';

const toPascalCase = (str: string) => {
    if (!str) return '';
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
}

const toCamelCase = (str: string) => {
  if (!str) return '';
  // First, convert to PascalCase to handle various inputs (snake_case, kebab-case)
  const pascal = str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_]/g, '');
  // Then, convert the first character to lowercase
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};


const getJavaType = (type: string, format: string | undefined, options: GenerationOptions, items?: any): string => {
  if (type === 'string') {
    if (format === 'date-time' || format === 'date') {
      return options.dateType === 'OffsetDateTime' ? 'OffsetDateTime' : 'String';
    }
    return 'String';
  }
  if (type === 'integer') {
    if (format === 'int64') return options.useBoxedPrimitives ? 'Long' : 'long';
    return options.useBoxedPrimitives ? 'Integer' : 'int';
  }
  if (type === 'number') {
    if (format === 'double') return options.useBoxedPrimitives ? 'Double' : 'double';
    if (format === 'float') return options.useBoxedPrimitives ? 'Float' : 'float';
    return 'BigDecimal';
  }
  if (type === 'boolean') {
    return options.useBoxedPrimitives ? 'Boolean' : 'boolean';
  }
  if (type === 'array') {
    const itemRef = items?.$ref?.split('/').pop();
    const itemType = itemRef
        ? toPascalCase(itemRef)
        : getJavaType(items?.type, items?.format, options);
    return `List<${itemType || 'Object'}>`;
  }
  if (type === 'object') {
    return 'Object';
  }
  return toPascalCase(type);
};

const getValidationAnnotations = (name: string, prop: any, schema: any, options: GenerationOptions, imports: Set<string>): string[] => {
    const annotations: string[] = [];
    const validationPrefix = `${options.validationApi}.validation.constraints`;

    if (schema.required?.includes(name)) {
        annotations.push('@NotNull');
        imports.add(`import ${validationPrefix}.NotNull;`);
    }

    if (prop.type === 'string') {
        if (prop.minLength !== undefined && prop.maxLength !== undefined) {
            annotations.push(`@Size(min = ${prop.minLength}, max = ${prop.maxLength})`);
            imports.add(`import ${validationPrefix}.Size;`);
        } else if (prop.minLength !== undefined) {
            annotations.push(`@Size(min = ${prop.minLength})`);
            imports.add(`import ${validationPrefix}.Size;`);
        } else if (prop.maxLength !== undefined) {
            annotations.push(`@Size(max = ${prop.maxLength})`);
            imports.add(`import ${validationPrefix}.Size;`);
        }

        if (prop.pattern) {
            annotations.push(`@Pattern(regexp = "${prop.pattern.replace(/\\/g, '\\\\')}")`);
            imports.add(`import ${validationPrefix}.Pattern;`);
        }
        if (prop.format === 'email') {
            annotations.push('@Email');
            imports.add(`import ${validationPrefix}.Email;`);
        }
        if (prop.format === 'uuid') {
            annotations.push(`@Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")`);
            imports.add(`import ${validationPrefix}.Pattern;`);
        }
    }
    
    if (prop.type === 'array') {
         if (prop.minItems !== undefined && prop.maxItems !== undefined) {
            annotations.push(`@Size(min = ${prop.minItems}, max = ${prop.maxItems})`);
            imports.add(`import ${validationPrefix}.Size;`);
        } else if (prop.minItems !== undefined) {
            annotations.push(`@Size(min = ${prop.minItems})`);
            imports.add(`import ${validationPrefix}.Size;`);
        } else if (prop.maxItems !== undefined) {
            annotations.push(`@Size(max = ${prop.maxItems})`);
            imports.add(`import ${validationPrefix}.Size;`);
        }
    }

    if (prop.type === 'integer' || prop.type === 'number') {
        if (prop.minimum !== undefined) {
             if (prop.exclusiveMinimum) {
                annotations.push(`@DecimalMin(value = "${prop.minimum}", inclusive = false)`);
                imports.add(`import ${validationPrefix}.DecimalMin;`);
             } else {
                annotations.push(`@Min(${prop.minimum})`);
                imports.add(`import ${validationPrefix}.Min;`);
             }
        }
        if (prop.maximum !== undefined) {
             if (prop.exclusiveMaximum) {
                annotations.push(`@DecimalMax(value = "${prop.maximum}", inclusive = false)`);
                imports.add(`import ${validationPrefix}.DecimalMax;`);
             } else {
                annotations.push(`@Max(${prop.maximum})`);
                imports.add(`import ${validationPrefix}.Max;`);
             }
        }
    }

    return annotations;
}

const generateField = (name: string, prop: any, options: GenerationOptions, allSchemas: any, schema: any, imports: Set<string>): string => {
  const fieldName = toCamelCase(name);
  let javaType;
  if(prop.$ref) {
      const refName = prop.$ref.split('/').pop();
      javaType = refName ? toPascalCase(refName) : 'Object';
  } else {
    javaType = getJavaType(prop.type, prop.format, options, prop.items);
  }

  let annotations: string[] = [];

  if (options.useValidationAnnotations) {
    annotations.push(...getValidationAnnotations(name, prop, schema, options, imports));
  }

  if (options.useJackson) {
    const jsonPropertyName = toPascalCase(name);
    annotations.push(`@JsonProperty("${jsonPropertyName}")`);
  }

  let fieldType = javaType;
  const isRequired = schema.required?.includes(name);

  if(options.useOptional && !isRequired) {
    fieldType = `Optional<${javaType}>`;
  }
  
  return annotations.map(a => `    ${a}`).join('\n') + `\n    private ${fieldType} ${fieldName};`;
};

const generateEnum = (name: string, schema: any, options: GenerationOptions): string => {
  const className = toPascalCase(name);
  let imports = new Set<string>();
  let enumBody = `public enum ${className} {\n`;
  schema.enum.forEach((val: string) => {
    const enumVal = val.toString().replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
    if (options.useJackson) {
      imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
      enumBody += `    @JsonProperty("${val}")\n`;
    }
    enumBody += `    ${enumVal},\n`;
  });
  
  let code = `package ${options.packageName};\n\n`;
  if (imports.size > 0) {
      code += Array.from(imports).sort().join('\n') + '\n\n';
  }
  
  code += enumBody.slice(0, -2) + "\n}\n";
  return code;
};

export const generateJavaCode = (
  schemaName: string,
  allSchemas: { [key: string]: any },
  options: GenerationOptions
): string => {
  const schema = allSchemas[schemaName];
  if (!schema) return `// Schema ${schemaName} not found.`;

  if (schema.enum && options.enumType === 'enum') {
    return generateEnum(schemaName, schema, options);
  }

  const className = toPascalCase(schemaName);
  const imports = new Set<string>();

  if (options.useLombok) imports.add('import lombok.Data;');
  if (options.useJackson) {
    imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');
    imports.add('import com.fasterxml.jackson.annotation.JsonInclude;');
  }
  if (options.useOptional) imports.add('import java.util.Optional;');
  
  let currentSchema = schema;
  let allProperties: { [key: string]: any } = {};

  const processedRefs = new Set<string>();
  const collectProperties = (current: any) => {
    if (current.allOf) {
        current.allOf.forEach((item: any) => {
            if (item.$ref) {
                const refName = item.$ref.split('/').pop();
                if (refName && !processedRefs.has(refName) && allSchemas[refName]) {
                    processedRefs.add(refName);
                    collectProperties(allSchemas[refName]);
                }
            } else {
                collectProperties(item);
            }
        });
    }

    if (current.properties) {
        Object.assign(allProperties, current.properties);
    }
    
    if (current.required) {
        if (!schema.required) schema.required = [];
        schema.required.push(...current.required);
    }
  };

  collectProperties(schema);
  
  const fields = Object.entries(allProperties)
    .map(([name, prop]) => {
      const propDef = prop as any;
      if (propDef.type === 'array') imports.add('import java.util.List;');
      if ((propDef.type === 'number' && !propDef.format) || propDef.format === 'bigdecimal') imports.add('import java.math.BigDecimal;');
      if (options.dateType === 'OffsetDateTime' && (propDef.format === 'date-time' || propDef.format === 'date')) {
          imports.add('import java.time.OffsetDateTime;');
      }
      return generateField(name, propDef, options, allSchemas, schema, imports);
    })
    .join('\n\n');


  let classAnnotations = '';
  if (options.useLombok) classAnnotations += '@Data\n';
  if (options.useJackson) classAnnotations += '@JsonInclude(JsonInclude.Include.NON_NULL)\n';
  
  const schemaExcerpt = `/*\n Original schema (excerpt):\n ${JSON.stringify(schema, null, 2).split('\n').slice(0, 10).join('\n')}\n*/`;

  let code = `package ${options.packageName};\n\n`;
  code += Array.from(imports).sort().join('\n') + '\n\n';
  code += `${schemaExcerpt}\n`;
  code += `${classAnnotations}public class ${className} {\n\n`;
  code += fields + '\n';
  
  if (!options.useLombok && options.generateHelpers) {
      // Basic getter/setter generation
      Object.entries(allProperties).forEach(([name, prop]) => {
          const fieldName = toCamelCase(name);
          let type;
          if ((prop as any).$ref) {
              const refName = (prop as any).$ref.split('/').pop();
              type = refName ? toPascalCase(refName) : 'Object';
          } else {
              type = getJavaType((prop as any).type, (prop as any).format, options, (prop as any).items);
          }
          const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          
          let fieldType = type;
          if (options.useOptional && !schema.required?.includes(name)) {
              fieldType = `Optional<${type}>`;
          }

          code += `\n    public ${fieldType} get${capitalizedFieldName}() {\n        return ${fieldName};\n    }\n`
          code += `\n    public void set${capitalizedFieldName}(${fieldType} ${fieldName}) {\n        this.${fieldName} = ${fieldName};\n    }\n`
      });
  }

  code += '}\n';

  return code;
};
