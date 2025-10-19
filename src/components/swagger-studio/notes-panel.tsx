
"use client"

import { useStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Notebook, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function NotesPanel() {
  const { notes, updateNote, activeNoteKey, setActiveNoteKey } = useStore();
  const [currentNote, setCurrentNote] = useState(notes[activeNoteKey] || '');
  const debouncedNote = useDebounce(currentNote, 300);

  useEffect(() => {
    setCurrentNote(notes[activeNoteKey] || '');
  }, [activeNoteKey, notes]);

  useEffect(() => {
    if (debouncedNote !== notes[activeNoteKey]) {
      updateNote(activeNoteKey, debouncedNote);
    }
  }, [debouncedNote, activeNoteKey, updateNote, notes]);
  
  return (
    <div className="h-full w-full flex flex-col bg-card border-t">
      <div className="flex items-center p-2 border-b">
        <Notebook className="h-5 w-5 mr-2 text-primary" />
        <h3 className="font-semibold">Notes</h3>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => setActiveNoteKey('global')}>
            <FileText className="mr-2 h-4 w-4"/>
            Global Notes
          </Button>
        </div>
      </div>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Write your Markdown notes here..."
              className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-code text-sm"
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full">
            <div className="p-4 prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentNote}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
