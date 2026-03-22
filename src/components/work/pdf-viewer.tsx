"use client";

import { useState } from "react";
import { FileTextIcon, DownloadIcon, ExpandIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PdfViewerProps {
  url: string;
  filename: string;
}

export function PdfViewer({ url, filename }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <FileTextIcon className="size-4 text-red-500" />
          <span className="truncate">{filename}</span>
        </div>
        <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-pulse text-sm text-muted-foreground">
                Loading PDF...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50">
              <FileTextIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Unable to preview PDF
              </p>
            </div>
          )}
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            className="w-full h-[400px]"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
            title={filename}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            disabled={error}
          >
            <ExpandIcon className="size-3 mr-1" />
            Fullscreen
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={url} download={filename} target="_blank" rel="noopener noreferrer">
              <DownloadIcon className="size-3 mr-1" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-medium truncate">{filename}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            className="w-full h-[calc(100%-45px)]"
            title={filename}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
