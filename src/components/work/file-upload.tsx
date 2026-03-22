"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileIcon, ImageIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/actions/work/upload-file";

interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: string;
  url: string;
  createdAt?: Date;
}

interface FileUploadProps {
  workId: string;
  attachments: Attachment[];
  onUpload: (attachment: Attachment) => void;
  onDelete: (attachmentId: string) => void;
  disabled?: boolean;
}

export function FileUpload({
  workId,
  attachments,
  onUpload,
  onDelete,
  disabled,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workId", workId);

        const result = await uploadFile(formData);
        
        onUpload({
          id: result.id || `temp-${Date.now()}`,
          filename: file.name,
          contentType: file.type,
          size: file.size.toString(),
          url: result.url,
        });
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [workId, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      files.forEach(handleFile);
    },
    [disabled, isUploading, handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(handleFile);
      e.target.value = "";
    },
    [handleFile],
  );

  const formatSize = (bytes: string) => {
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return <ImageIcon className="size-4" />;
    if (contentType === "application/pdf") return <FileTextIcon className="size-4" />;
    return <FileIcon className="size-4" />;
  };

  const isPreviewable = (contentType: string) => {
    return (
      contentType.startsWith("image/") ||
      contentType === "application/pdf" ||
      contentType.startsWith("text/")
    );
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          accept="*/*"
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" />
          )}
          <div className="text-sm">
            <span className="font-medium">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-muted-foreground">
            Any file type supported
          </p>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border p-2"
            >
              {isPreviewable(attachment.contentType) ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {getFileIcon(attachment.contentType)}
                  <span className="truncate max-w-[150px]">
                    {attachment.filename}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  {getFileIcon(attachment.contentType)}
                  <span className="truncate max-w-[150px]">
                    {attachment.filename}
                  </span>
                </div>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatSize(attachment.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(attachment.id)}
                disabled={disabled}
                className="size-7 p-0"
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
