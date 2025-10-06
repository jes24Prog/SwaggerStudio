"use client"

import { useStore } from "@/lib/store";
import SwaggerUI from "swagger-ui-react";
import { RedocStandalone } from 'redoc';
import { useTheme } from "next-themes";
import { AlertTriangle, Loader2, FileWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function PreviewPanel() {
  const { previewType, parsedSpec, missingSchemas } = useStore();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasErrors = !parsedSpec;
  const hasMissingSchemas = missingSchemas.length > 0;

  return (
    <div className="h-full w-full overflow-auto bg-background">
      {hasErrors ? (
        <div className="flex h-full w-full items-center justify-center bg-muted/50 p-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Invalid or Empty Spec</h3>
            <p>The OpenAPI specification is either empty or contains errors that prevent rendering.</p>
            <p>Please check the validation panel below the editor.</p>
          </div>
        </div>
      ) : (
        <>
          {hasMissingSchemas && (
             <Alert variant="destructive" className="m-4 rounded-lg">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Missing Schema Definitions</AlertTitle>
              <AlertDescription>
                Your specification references schemas that are not defined. Check the validation panel for details.
                <ul>
                  {missingSchemas.slice(0, 3).map(s => (
                    <li key={s.path}>- <strong>{s.schema}</strong></li>
                  ))}
                   {missingSchemas.length > 3 && (
                    <li>- and {missingSchemas.length - 3} more...</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewType === 'swagger-ui' && (
            <div className={theme}>
              <SwaggerUI spec={parsedSpec!} />
            </div>
          )}
          {previewType === 'redoc' && (
            <div id="redoc-container">
              <RedocStandalone
                spec={parsedSpec!}
                options={{
                  scrollYOffset: 0,
                  theme: {
                    colors: {
                      primary: { main: theme === 'dark' ? '#3498db' : '#3498db' },
                    },
                    typography: {
                      fontFamily: '"Inter", sans-serif',
                      code: {
                        fontFamily: '"Source Code Pro", monospace',
                      }
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
