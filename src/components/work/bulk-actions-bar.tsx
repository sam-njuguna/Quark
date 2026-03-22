"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { bulkUpdateStage, bulkDelete } from "@/actions/work/bulk";
import { ChevronDownIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_review", label: "Awaiting Review" },
  { value: "revision", label: "Revision" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkActionsBar({ selectedIds, onClearSelection }: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  if (selectedIds.length === 0) return null;

  function handleStageChange(stage: string) {
    startTransition(async () => {
      try {
        const result = await bulkUpdateStage({ ids: selectedIds, stage });
        toast.success(`Updated ${result.updated} items to "${stage.replace("_", " ")}"`);
        onClearSelection();
      } catch {
        toast.error("Failed to update stage");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${selectedIds.length} item(s)? This cannot be undone.`)) return;
    setIsDeleting(true);
    startTransition(async () => {
      try {
        const result = await bulkDelete({ ids: selectedIds });
        toast.success(`Deleted ${result.deleted} item(s)`);
        onClearSelection();
      } catch {
        toast.error("Failed to delete items");
      } finally {
        setIsDeleting(false);
      }
    });
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg">
      <Badge variant="secondary" className="text-xs">
        {selectedIds.length} selected
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            Move to
            <ChevronDownIcon className="ml-1 size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Change stage</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STAGES.map((s) => (
            <DropdownMenuItem key={s.value} onSelect={() => handleStageChange(s.value)}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={isPending || isDeleting}
      >
        <Trash2Icon className="size-3.5 mr-1" />
        Delete
      </Button>

      <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isPending}>
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
