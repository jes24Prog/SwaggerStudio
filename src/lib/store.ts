import { create } from 'zustand';
import { OpenAPIV3 } from 'openapi-types';
import { ValidationError } from 'openapi-schema-validator';

// Types
export type Project = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PreviewType = 'swagger-ui' | 'redoc';

export type MissingSchema = {
  path: string;
  schema: string;
};

export type AppState = {
  spec: string;
  setSpec: (spec: string) => void;
  
  parsedSpec: object | null;
  setParsedSpec: (parsedSpec: object | null) => void;

  projects: Project[];
  setProjects: (projects: Project[]) => void;
  
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  previewType: PreviewType;
  togglePreviewType: () => void;
  
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;

  missingSchemas: MissingSchema[];
  setMissingSchemas: (schemas: MissingSchema[]) => void;
  
  isDirty: boolean;
  setDirty: (isDirty: boolean) => void;
};

export const useStore = create<AppState>((set) => ({
  spec: '',
  setSpec: (spec) => set({ spec, isDirty: true }),
  
  parsedSpec: null,
  setParsedSpec: (parsedSpec) => set({ parsedSpec }),

  projects: [],
  setProjects: (projects) => set({ projects }),
  
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  previewType: 'swagger-ui',
  togglePreviewType: () => set((state) => ({
    previewType: state.previewType === 'swagger-ui' ? 'redoc' : 'swagger-ui'
  })),
  
  validationErrors: [],
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  
  missingSchemas: [],
  setMissingSchemas: (schemas) => set({ missingSchemas: schemas }),

  isDirty: false,
  setDirty: (isDirty) => set({ isDirty }),
}));
