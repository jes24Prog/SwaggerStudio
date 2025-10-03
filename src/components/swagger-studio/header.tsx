"use client"

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { FileDown, FileUp, FolderOpen, Moon, Save, Sun, FilePlus2, Code, BookOpen, SquareTerminal, Wand2 } from "lucide-react";
import { useStore, Project } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatSpec, downloadFile } from "@/lib/swagger-utils";
import { DEFAULT_SPEC, PETSTORE_SPEC } from "@/lib/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Label } from "../ui/label";

export function SwaggerStudioHeader() {
  const { theme, setTheme } = useTheme();
  const { spec, setSpec, projects, setProjects, currentProjectId, setCurrentProjectId, previewType, togglePreviewType, setDirty, isDirty } = useStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaveAsOpen, setSaveAsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isOpenProjectOpen, setOpenProjectOpen] = useState(false);

  const handleSave = () => {
    if (currentProjectId) {
      const updatedProjects = projects.map(p =>
        p.id === currentProjectId ? { ...p, content: spec, updatedAt: new Date().toISOString() } : p
      );
      setProjects(updatedProjects);
      localStorage.setItem('swagger-studio-projects', JSON.stringify(updatedProjects));
      setDirty(false);
      toast({ title: "Project Saved", description: "Your changes have been saved." });
    } else {
      setSaveAsOpen(true);
    }
  };

  const handleSaveAs = () => {
    if (!newProjectName.trim()) {
      toast({ variant: "destructive", title: "Invalid Name", description: "Project name cannot be empty." });
      return;
    }
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      content: spec,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setCurrentProjectId(newProject.id);
    localStorage.setItem('swagger-studio-projects', JSON.stringify(updatedProjects));
    localStorage.setItem('swagger-studio-last-opened', newProject.id);
    setDirty(false);
    setSaveAsOpen(false);
    setNewProjectName("");
    toast({ title: "Project Saved", description: `Project "${newProjectName}" has been saved.` });
  };

  const handleOpenProject = (project: Project) => {
    setSpec(project.content);
    setCurrentProjectId(project.id);
    localStorage.setItem('swagger-studio-last-opened', project.id);
    setDirty(false);
    setOpenProjectOpen(false);
    toast({ title: "Project Loaded", description: `Project "${project.name}" has been loaded.` });
  };
  
  const handleNewProject = () => {
    setSpec(DEFAULT_SPEC);
    setCurrentProjectId(null);
    setDirty(false);
    toast({ title: "New Project" });
  };

  const handleFormat = async () => {
    try {
      const formatted = await formatSpec(spec);
      setSpec(formatted);
      toast({ title: "Formatted", description: "The content has been formatted." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Formatting Failed", description: e.message });
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSpec(content);
        setCurrentProjectId(null);
        toast({ title: "File Imported", description: "Content loaded from file." });
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between px-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <SquareTerminal className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold">Swagger Studio</h1>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">File</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={handleNewProject}><FilePlus2 className="mr-2"/>New Project</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenProjectOpen(true)}><FolderOpen className="mr-2"/>Open Project</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSave} disabled={!isDirty}><Save className="mr-2"/>Save</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSaveAsOpen(true)}>Save As...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Import/Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}><FileUp className="mr-2"/>Import File...</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => downloadFile(spec, 'spec.yaml', 'yaml')}><FileDown className="mr-2"/>Export as YAML</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadFile(spec, 'spec.json', 'json')}><FileDown className="mr-2"/>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost">Templates</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => {setSpec(DEFAULT_SPEC); setCurrentProjectId(null);}}>Basic Template</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {setSpec(PETSTORE_SPEC); setCurrentProjectId(null);}}>Petstore API</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" onClick={handleFormat}><Wand2 className="mr-2 h-4 w-4"/>Format</Button>
          
          <div className="w-px h-6 bg-border mx-2" />

          <Button variant="ghost" size="icon" onClick={togglePreviewType} title="Toggle Preview Mode">
            {previewType === 'swagger-ui' ? <BookOpen /> : <Code />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle Theme">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>
      <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json,.yaml,.yml" className="hidden" />

      {/* Save As Dialog */}
      <Dialog open={isSaveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project As</DialogTitle>
            <DialogDescription>Enter a name for your new project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveAs}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Open Project Dialog */}
      <Dialog open={isOpenProjectOpen} onOpenChange={setOpenProjectOpen}>
        <DialogContent>
           <DialogHeader>
            <DialogTitle>Open Project</DialogTitle>
            <DialogDescription>Select a project to load into the editor.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {projects.length > 0 ? (
              projects.map(p => (
                <div key={p.id} onClick={() => handleOpenProject(p)} className="p-2 rounded-md hover:bg-accent cursor-pointer">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">Last updated: {new Date(p.updatedAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No saved projects found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
