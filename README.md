# Swagger Studio

Swagger Studio is a powerful, web-based editor and visualizer for OpenAPI (formerly Swagger) specifications. It provides a seamless experience for developers to write, validate, and preview API documentation in real-time, with a side-by-side editor and multiple rendering options.

## ✨ Features

- **Live Editing**: Edit your OpenAPI specification in YAML or JSON and see the changes reflected instantly in the preview pane.
- **Dual Preview Modes**:
  - **Swagger UI**: An interactive UI that allows you to explore and test API endpoints directly.
  - **Redoc**: Generates clean, three-panel documentation for a more readable experience.
- **Real-time Validation**: The editor validates your specification against the OpenAPI 3.1 schema as you type, highlighting errors and providing helpful feedback.
- **Project Management**:
  - **Save & Open**: Save your specifications as projects directly in your browser's local storage.
  - **New Projects**: Start fresh with a basic API template.
- **Import & Export**:
  - **Import**: Drag and drop a `.yaml` or `.json` file onto the editor or use the file menu to load an existing specification.
  - **Export**: Download your current specification as either a `spec.yaml` or `spec.json` file.
- **Templates**: Kickstart your work with pre-built templates, including a basic starter API and the classic Petstore API.
- **Responsive Design**: A fluid layout that works on both desktop and mobile devices. On mobile, you can easily toggle between the editor and preview views.
- **Dark & Light Themes**: Switch between themes to suit your preference.
- **Code Formatting**: Automatically format your YAML or JSON code with a single click for better readability.

## 🚀 Tech Stack

This project is built with a modern, robust, and scalable tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router and Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible components.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (the engine that powers VS Code) with `monaco-yaml` for schema validation.
- **API Preview**:
  - [Swagger UI React](https://github.com/swagger-api/swagger-ui/tree/master/npm/swagger-ui-react)
  - [Redoc](https://github.com/Redocly/redoc)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **File Handling**: [React Dropzone](https://react-dropzone.js.org/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/) or another package manager like [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/).

### Running the Development Server

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Project Structure

- `src/app/page.tsx`: The main entry point and layout of the application.
- `src/components/swagger-studio/`: Contains the core components of the application (Header, Editor, Preview, etc.).
- `src/components/ui/`: Houses the ShadCN UI components.
- `src/lib/`: Contains utility functions, state management (`store.ts`), and API templates.
- `src/hooks/`: Custom React hooks used throughout the application.
- `public/`: Static assets.
- `next.config.ts`: Next.js configuration file.
- `tailwind.config.ts`: Tailwind CSS configuration.

## 🕹️ How to Use

- **Editing**: Type directly into the editor on the left.
- **Switching Previews**: Use the **Book** (`<BookOpen/>`) and **Code** (`<Code/>`) icons in the header to toggle between Swagger UI and Redoc previews.
- **Saving**:
  - Use **File > Save** (`Cmd/Ctrl + S`) to update the current project.
  - Use **File > Save As...** to save the current content as a new project.
- **Loading**: Use **File > Open Project** to load a previously saved project from your browser.
- **Import/Export**: The **Import/Export** menu provides options to load from or save to your local file system.
- **Formatting**: Click the **Format** button in the header to prettify your code.
