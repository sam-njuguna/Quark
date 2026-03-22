"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookmarkIcon, CirclePlus, Trash2Icon } from "lucide-react";
import {
  getSavedViews,
  saveView,
  deleteView,
  type WorkFilter,
  type SavedView,
} from "@/lib/work-views";

interface SavedViewsBarProps {
  currentFilters: WorkFilter;
  onApply: (filters: WorkFilter) => void;
}

export function SavedViewsBar({ currentFilters, onApply }: SavedViewsBarProps) {
  const [views, setViews] = useState<SavedView[]>(() =>
    typeof window !== "undefined" ? getSavedViews() : [],
  );
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleSave() {
    if (!newName.trim()) return;
    const saved = saveView(newName.trim(), currentFilters);
    setViews(getSavedViews());
    setNewName("");
    setOpen(false);
    setActiveId(saved.id);
  }

  function handleApply(view: SavedView) {
    setActiveId(view.id);
    onApply(view.filters);
  }

  function handleDelete(id: string) {
    deleteView(id);
    setViews(getSavedViews());
    if (activeId === id) {
      setActiveId(null);
      onApply({});
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {views.map((view) => (
        <div key={view.id} className="flex items-center gap-0.5">
          <Button
            variant={activeId === view.id ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-r-none"
            onClick={() => handleApply(view)}
            aria-pressed={activeId === view.id}
          >
            <BookmarkIcon className="mr-1 size-3" />
            {view.name}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 rounded-l-none border-l-0 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(view.id)}
            aria-label={`Delete view "${view.name}"`}
          >
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <CirclePlus className="size-3" />
            Save view
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <p className="text-xs text-muted-foreground mb-2">
            Save current filters as a view
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="View name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!newName.trim()}
              className="h-7"
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {activeId && (
        <Badge variant="secondary" className="text-xs">
          Filtered view active
        </Badge>
      )}
    </div>
  );
}
