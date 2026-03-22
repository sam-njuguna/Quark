"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";

const stages = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_review", label: "Awaiting Review" },
  { value: "revision", label: "Revision" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const types = [
  { value: "task", label: "Task" },
  { value: "meeting", label: "Meeting" },
  { value: "research", label: "Research" },
  { value: "code", label: "Code" },
  { value: "document", label: "Document" },
  { value: "communication", label: "Communication" },
];

interface WorkFiltersProps {
  currentStage?: string;
  currentType?: string;
}

export function WorkFilters({ currentStage, currentType }: WorkFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("?");
  };

  const hasFilters = currentStage || currentType;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentStage || ""}
        onValueChange={(value) => updateFilter("stage", value === "__all__" ? null : value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All stages</SelectItem>
          {stages.map((stage) => (
            <SelectItem key={stage.value} value={stage.value}>
              {stage.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentType || ""}
        onValueChange={(value) => updateFilter("type", value === "__all__" ? null : value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All types</SelectItem>
          {types.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {currentStage && (
              <Badge variant="secondary" className="gap-1">
                Stage: {stages.find((s) => s.value === currentStage)?.label}
                <button
                  onClick={() => updateFilter("stage", null)}
                  className="ml-1 hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            )}
            {currentType && (
              <Badge variant="secondary" className="gap-1">
                Type: {types.find((t) => t.value === currentType)?.label}
                <button
                  onClick={() => updateFilter("type", null)}
                  className="ml-1 hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
