"use client"

import { useStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, BadgeCheck, FileWarning, PlusCircle, ShieldX } from "lucide-react";
import { Button } from "../ui/button";
import * as yaml from 'js-yaml';
import { useToast } from "@/hooks/use-toast";

export function ValidationPanel() {
  const { validationErrors, missingSchemas, spec, setSpec } = useStore();
  const { toast } = useToast();

  const handleGoToLine = (path: string) => {
    if (typeof (window as any).goToMonacoLine === 'function') {
      (window as any).goToMonacoLine(path);
    }
  };

  const handleAddPlaceholder = (schemaName: string) => {
    try {
      let parsedSpec = yaml.load(spec) as any;
      if (typeof parsedSpec !== 'object' || parsedSpec === null) {
        toast({ variant: "destructive", title: "Error", description: "Could not parse the spec to add placeholder." });
        return;
      }

      if (!parsedSpec.components) {
        parsedSpec.components = {};
      }
      if (!parsedSpec.components.schemas) {
        parsedSpec.components.schemas = {};
      }

      if (parsedSpec.components.schemas[schemaName]) {
         toast({ title: "Info", description: `Schema "${schemaName}" already exists.` });
         return;
      }

      parsedSpec.components.schemas[schemaName] = {
        type: 'object',
        properties: {
          id: { type: 'string', description: `TODO: Define properties for ${schemaName}` }
        },
        description: `TODO: Define schema for ${schemaName}`
      };
      
      const newSpec = yaml.dump(parsedSpec);
      setSpec(newSpec);
      toast({ title: "Schema Added", description: `Placeholder for "${schemaName}" has been added.` });
    } catch (e: any) {
       toast({ variant: "destructive", title: "Error", description: `Failed to add placeholder: ${e.message}` });
    }
  };
  
  const handleAddAllPlaceholders = () => {
    try {
      let parsedSpec = yaml.load(spec) as any;
      if (typeof parsedSpec !== 'object' || parsedSpec === null) {
        toast({ variant: "destructive", title: "Error", description: "Could not parse the spec." });
        return;
      }

      if (!parsedSpec.components) parsedSpec.components = {};
      if (!parsedSpec.components.schemas) parsedSpec.components.schemas = {};

      let addedCount = 0;
      missingSchemas.forEach(({ schema }) => {
        if (!parsedSpec.components.schemas[schema]) {
          parsedSpec.components.schemas[schema] = {
            type: 'object',
            description: `TODO: Define schema for ${schema}`,
          };
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        const newSpec = yaml.dump(parsedSpec);
        setSpec(newSpec);
        toast({ title: "Placeholders Added", description: `${addedCount} missing schema placeholder(s) have been added.` });
      } else {
        toast({ title: "No Action Needed", description: "All missing schemas already exist or there are none to add." });
      }
    } catch (e: any) {
       toast({ variant: "destructive", title: "Error", description: `Failed to add placeholders: ${e.message}` });
    }
  };

  const totalIssues = validationErrors.length + missingSchemas.length;

  return (
    <div className="h-full w-full flex flex-col bg-card border-t">
      <div className="flex items-center p-2 border-b">
        <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
        <h3 className="font-semibold">Validation Results</h3>
        <div className="ml-auto flex items-center gap-4 text-sm">
          {totalIssues > 0 ? (
            <>
              <span className="flex items-center gap-1 text-destructive"><ShieldX className="h-4 w-4" /> {validationErrors.length} Errors</span>
              <span className="flex items-center gap-1 text-yellow-500"><FileWarning className="h-4 w-4" /> {missingSchemas.length} Missing Schemas</span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-green-500"><BadgeCheck className="h-4 w-4" /> No issues found</span>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 text-sm font-code">
          {totalIssues === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-4">
              <BadgeCheck className="w-10 h-10 text-green-500 mb-2"/>
              <p>Your OpenAPI spec is valid!</p>
            </div>
          ) : (
            <>
              {validationErrors.map((error, index) => (
                <div key={`err-${index}`} onClick={() => handleGoToLine(error.instancePath)} className="p-2 border-b border-dashed hover:bg-muted/50 cursor-pointer">
                  <p>
                    <span className="font-semibold text-destructive mr-2">SCHEMA ERROR:</span>
                    <span className="text-muted-foreground">{error.instancePath || '/'}</span>
                  </p>
                  <p className="pl-4">{error.message}</p>
                </div>
              ))}
              {missingSchemas.length > 0 && (
                <div className="p-2 border-b border-dashed">
                  <Button size="sm" variant="outline" className="w-full" onClick={handleAddAllPlaceholders}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add All Missing Schema Placeholders
                  </Button>
                </div>
              )}
              {missingSchemas.map((schema, index) => (
                 <div key={`missing-${index}`} className="p-2 border-b border-dashed hover:bg-muted/50">
                   <div onClick={() => handleGoToLine(schema.path)} className="cursor-pointer">
                    <p>
                      <span className="font-semibold text-yellow-500 mr-2">MISSING SCHEMA:</span>
                      <span className="text-muted-foreground">{schema.schema}</span>
                    </p>
                    <p className="pl-4">Referenced in: <span className="text-muted-foreground">{schema.path}</span></p>
                   </div>
                   <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleAddPlaceholder(schema.schema)}>
                     <PlusCircle className="mr-2 h-4 w-4" />
                     Add placeholder for `{schema.schema}`
                   </Button>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
