"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

function MotionEnvelope({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();
  return (
    <MotionConfig
      reducedMotion={reduced ? "always" : "never"}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "tween", duration: 0.22, ease: "easeOut" }
      }
    >
      {children}
    </MotionConfig>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <TooltipProvider delayDuration={300} skipDelayDuration={150}>
          <MotionEnvelope>{children}</MotionEnvelope>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
