"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookmarkIcon,
  CirclePlus,
  TrashIcon,
  CheckIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "quark_filter_presets";

const SYSTEM_PRESETS: {
  name: string;
  params: Record<string, string>;
  color: string;
}[] = [
  {
    name: "Review Queue",
    params: { stage: "awaiting_review" },
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    name: "Blocked",
    params: { stage: "blocked" },
    color: "text-red-600 dark:text-red-400",
  },
  {
    name: "In Progress",
    params: { stage: "in_progress" },
    color: "text-amber-600 dark:text-amber-400",
  },
];

interface Preset {
  id: string;
  name: string;
  params: Record<string, string>;
}

function loadPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function FilterPresets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const currentParams: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    if (k !== "view") currentParams[k] = v;
  });
  const hasFilters = Object.keys(currentParams).length > 0;

  const applyPreset = (preset: Pick<Preset, "params">) => {
    const q = new URLSearchParams(preset.params);
    const view = searchParams.get("view");
    if (view) q.set("view", view);
    router.push(`/dashboard/all?${q.toString()}`);
    setOpen(false);
  };

  const saveCurrentAsPreset = () => {
    if (!newName.trim() || !hasFilters) return;
    const preset: Preset = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      params: currentParams,
    };
    const next = [...presets, preset];
    savePresets(next);
    setPresets(next);
    setNewName("");
    toast.success(`Preset "${preset.name}" saved`);
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    savePresets(next);
    setPresets(next);
    toast.success("Preset deleted");
  };

  const isActive = (preset: Preset) =>
    Object.entries(preset.params).every(
      ([k, v]) => searchParams.get(k) === v,
    ) &&
    Object.keys(preset.params).length === Object.keys(currentParams).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <BookmarkIcon className="size-3.5" />
          Presets
          {presets.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
              {presets.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
            <ZapIcon className="size-3" />
            Quick Filters
          </p>
          {SYSTEM_PRESETS.map((preset) => {
            const active = Object.entries(preset.params).every(
              ([k, v]) => searchParams.get(k) === v,
            );
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted ${
                  active ? "bg-muted" : ""
                }`}
              >
                <span className={active ? preset.color : "text-foreground"}>
                  {preset.name}
                </span>
                {active && <CheckIcon className="size-3 text-primary" />}
              </button>
            );
          })}
        </div>

        <Separator />

        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Saved Presets
        </p>

        {presets.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No saved presets yet. Apply filters then save below.
          </p>
        )}

        {presets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-1.5">
            <button
              onClick={() => applyPreset(preset)}
              className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
            >
              {isActive(preset) && (
                <CheckIcon className="size-3 text-primary shrink-0" />
              )}
              <span className="truncate">{preset.name}</span>
              <div className="ml-auto flex gap-0.5">
                {Object.entries(preset.params).map(([k, v]) => (
                  <Badge
                    key={k}
                    variant="outline"
                    className="text-[9px] px-1 py-0"
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => deletePreset(preset.id)}
            >
              <TrashIcon className="size-3" />
            </Button>
          </div>
        ))}

        {hasFilters && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Save current filters as preset
              </p>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Preset name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-7 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && saveCurrentAsPreset()}
                />
                <Button
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={saveCurrentAsPreset}
                  disabled={!newName.trim()}
                >
                  <CirclePlus className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {!hasFilters && (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              Apply at least one filter to save a preset.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
