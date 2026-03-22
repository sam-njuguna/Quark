"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Wire to Sentry or other error tracking service here:
      // Sentry.captureException(error);
      console.error("[GlobalError]", error.digest ?? "", error.message);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs opacity-60">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <Button onClick={reset}>Try again</Button>
      </body>
    </html>
  );
}
