"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileIcon, GripVerticalIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: number;
}

interface FileListDndProps {
  attachments: Attachment[];
  onReorder?: (ids: string[]) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileListDnd({ attachments, onReorder, onDelete, readonly }: FileListDndProps) {
  const [items, setItems] = useState(attachments);
  const dragIdx = useRef<number | null>(null);
  const [draggingOver, setDraggingOver] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, idx: number) {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggingOver(idx);
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === targetIdx) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
    onReorder?.(next.map((i) => i.id));
    dragIdx.current = null;
    setDraggingOver(null);
  }

  function handleDragEnd() {
    dragIdx.current = null;
    setDraggingOver(null);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    onDelete?.(id);
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">No attachments</p>
    );
  }

  return (
    <ul className="space-y-1.5" aria-label="Attachments">
      {items.map((item, idx) => (
        <li
          key={item.id}
          draggable={!readonly}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors",
            !readonly && "cursor-grab active:cursor-grabbing",
            draggingOver === idx && "border-primary bg-primary/5",
          )}
          aria-label={item.name}
        >
          {!readonly && (
            <GripVerticalIcon
              className="size-3.5 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          )}
          <FileIcon className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate font-medium">{item.name}</span>
          {item.size != null && (
            <span className="text-muted-foreground shrink-0">{formatBytes(item.size)}</span>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={`Download ${item.name}`}
          >
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>
          {!readonly && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => handleDelete(item.id)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2Icon className="size-3" aria-hidden="true" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
