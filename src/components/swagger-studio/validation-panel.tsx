"use client"

import { useStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";

export function ValidationPanel() {
  const { validationErrors } = useStore();
  const errorCount = validationErrors.filter(e => e.keyword === 'required' || e.keyword === 'type').length;
  const warningCount = validationErrors.length - errorCount;


  return (
    <div className="h-full w-full flex flex-col bg-card border-t">
      <div className="flex items-center p-2 border-b">
        <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
        <h3 className="font-semibold">Validation Results</h3>
        <div className="ml-auto flex items-center gap-4 text-sm">
          {validationErrors.length > 0 ? (
            <>
              <span className="flex items-center gap-1 text-destructive"><ShieldX className="h-4 w-4" /> {errorCount} Errors</span>
              <span className="flex items-center gap-1 text-yellow-500"><ShieldAlert className="h-4 w-4" /> {warningCount} Warnings</span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-green-500"><BadgeCheck className="h-4 w-4" /> No issues found</span>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 text-sm font-code">
          {validationErrors.length > 0 ? (
            validationErrors.map((error, index) => (
              <div key={index} className="p-2 border-b border-dashed hover:bg-muted/50 cursor-pointer">
                <p>
                  <span className="font-semibold text-destructive mr-2">{error.keyword.toUpperCase()}:</span>
                  <span className="text-muted-foreground">{error.instancePath || '/'}</span>
                </p>
                <p className="pl-4">{error.message}</p>
              </div>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-4">
              <BadgeCheck className="w-10 h-10 text-green-500 mb-2"/>
              <p>Your OpenAPI spec is valid!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
