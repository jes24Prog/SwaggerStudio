export interface GenerationOptions {
  packageName: string;
  useLombok: boolean;
  useJackson: boolean;
  dateType: 'OffsetDateTime' | 'String';
  useBoxedPrimitives: boolean;
  generateHelpers: boolean;
  useOptional: boolean;
  enumType: 'enum' | 'String';
  useValidationAnnotations: boolean;
  validationApi: 'jakarta' | 'javax';
}

export interface Schema {
  name: string;
  description?: string;
  properties: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

export interface GeneratedCode {
  name: string;
  code: string;
}
