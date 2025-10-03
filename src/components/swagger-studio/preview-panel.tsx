"use client"

import { useStore } from "@/lib/store";
import SwaggerUI from "swagger-ui-react";
import { RedocStandalone } from 'redoc';
import { useTheme } from "next-themes";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function PreviewPanel() {
  const { previewType, parsedSpec } = useStore();
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

  if (!parsedSpec) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50 p-8">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Invalid or Empty Spec</h3>
          <p>The OpenAPI specification is either empty or contains errors that prevent rendering.</p>
          <p>Please check the validation panel below the editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-background">
      {previewType === 'swagger-ui' && (
        <div className={theme}>
          <SwaggerUI spec={parsedSpec} />
        </div>
      )}
      {previewType === 'redoc' && (
        <div id="redoc-container">
          <RedocStandalone
            spec={parsedSpec}
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
    </div>
  );
}
