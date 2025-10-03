# **App Name**: SwaggerHub

## Core Features:

- OpenAPI Editor: Monaco-based editor with YAML/JSON support, autocompletion, and linting.
- Live Preview: Interactive documentation and API console powered by Swagger UI or Redoc, with live updates on editor changes.
- Import & Export: Drag-and-drop, file picker, and paste functionality for importing OpenAPI specs; export to YAML or JSON.
- Local Storage: Save and load OpenAPI projects directly in the browser's local storage, with title, description, and file content.
- Shareable Links: Generate shareable links by encoding the spec in the URL for easy sharing (uses compression).
- Validation Tool: Real-time schema validation with error highlighting and navigation in the editor using the AJV library.
- Format & Beautify: Tool to Automatically format and beautify YAML/JSON code for improved readability.

## Style Guidelines:

- Primary color: Dark blue (#3498DB) to reflect a professional and reliable tool.
- Background color: Very dark gray (#222222) to create a dark color scheme that is easy on the eyes for long editing sessions.
- Accent color: Bright cyan (#1ABC9C) to provide contrast and highlight key actions and elements.
- Font pairing: 'Inter' (sans-serif) for body and headlines, to ensure readability and a modern, clean aesthetic.
- Code font: 'Source Code Pro' for code display within the editor and preview sections.
- Use a set of simple, geometric icons for toolbar actions.
- Maintain a clean two-pane layout with a collapsible error panel at the bottom for validation results.
- Subtle animations for loading states and transitions between Swagger UI and Redoc views.