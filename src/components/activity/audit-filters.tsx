"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, XIcon } from "lucide-react";

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "stage_changed", label: "Stage Changed" },
  { value: "commented", label: "Commented" },
  { value: "approved", label: "Approved" },
  { value: "submitted", label: "Submitted" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
  { value: "assigned", label: "Assigned" },
  { value: "rejected", label: "Rejected" },
];

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentAction = searchParams.get("action") ?? "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const clearAll = () => {
    startTransition(() => {
      router.push("?");
    });
  };

  const hasFilters = currentSearch || currentAction !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search by user or work item…"
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout((window as Window & { _auditSearchTimer?: ReturnType<typeof setTimeout> })._auditSearchTimer);
            (window as Window & { _auditSearchTimer?: ReturnType<typeof setTimeout> })._auditSearchTimer = setTimeout(
              () => updateParam("search", val),
              300,
            );
          }}
        />
      </div>

      <Select
        value={currentAction}
        onValueChange={(v) => updateParam("action", v)}
      >
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          {ACTION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 gap-1.5 text-xs"
        >
          <XIcon className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
