
import { create } from 'zustand';
import { OpenAPIV3 } from 'openapi-types';
import { ValidationError } from 'openapi-schema-validator';
import { EditorFormat } from './swagger-utils';

// Types
export type Project = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PreviewType = 'swagger-ui' | 'redoc' | 'erd' | 'compare' | 'excel';

export type MissingSchema = {
  path: string;
  schema: string;
};

export type Notes = {
  [key: string]: string;
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
  setPreviewType: (type: PreviewType) => void;
  
  validationErrors: ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;

  missingSchemas: MissingSchema[];
  setMissingSchemas: (schemas: MissingSchema[]) => void;
  
  isDirty: boolean;
  setDirty: (isDirty: boolean) => void;

  isValidationPanelOpen: boolean;
  toggleValidationPanel: () => void;

  editorFormat: EditorFormat;
  setEditorFormat: (format: EditorFormat) => void;

  isNotesPanelOpen: boolean;
  toggleNotesPanel: () => void;

  notes: Notes;
  setNotes: (notes: Notes) => void;
  updateNote: (key: string, content: string) => void;

  activeNoteKey: string;
  setActiveNoteKey: (key: string) => void;
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
  setPreviewType: (type) => set({ previewType: type }),
  
  validationErrors: [],
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  
  missingSchemas: [],
  setMissingSchemas: (schemas) => set({ missingSchemas: schemas }),

  isDirty: false,
  setDirty: (isDirty) => set({ isDirty }),

  isValidationPanelOpen: false,
  toggleValidationPanel: () => set((state) => ({ isValidationPanelOpen: !state.isValidationPanelOpen })),

  editorFormat: 'yaml',
  setEditorFormat: (format) => set({ editorFormat: format }),

  isNotesPanelOpen: false,
  toggleNotesPanel: () => set((state) => ({ isNotesPanelOpen: !state.isNotesPanelOpen })),

  notes: { global: 'Welcome to your notes panel!' },
  setNotes: (notes) => set({ notes }),
  updateNote: (key, content) => set((state) => {
    const newNotes = { ...state.notes, [key]: content };
    localStorage.setItem('swagger-studio-notes', JSON.stringify(newNotes));
    return { notes: newNotes };
  }),

  activeNoteKey: 'global',
  setActiveNoteKey: (key) => set({ activeNoteKey: key }),
}));
