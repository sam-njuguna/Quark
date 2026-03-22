"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboardIcon,
  CirclePlus,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  BarChart3Icon,
  HistoryIcon,
  NetworkIcon,
  PlugIcon,
  ArrowRightIcon,
} from "lucide-react";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const router = useRouter();

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenChange(!isOpen);
        return;
      }
      // "/" or "n" shortcuts — only when not in an input
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "/" || e.key === "s") {
          e.preventDefault();
          handleOpenChange(true);
        }
        if (e.key === "n") {
          e.preventDefault();
          router.push("/dashboard/new");
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [handleOpenChange, isOpen, router]);

  const navigateTo = (path: string) => {
    router.push(path);
    handleOpenChange(false);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigateTo("/dashboard")}>
            <LayoutDashboardIcon className="size-4 mr-2" />
            Dashboard
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/dashboard/all")}>
            <SearchIcon className="size-4 mr-2" />
            All Work
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/dashboard/analytics")}>
            <BarChart3Icon className="size-4 mr-2" />
            Analytics
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/dashboard/audit")}>
            <HistoryIcon className="size-4 mr-2" />
            Audit Trail
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Teams">
          <CommandItem onSelect={() => navigateTo("/dashboard/hierarchy")}>
            <NetworkIcon className="size-4 mr-2" />
            Team Hierarchy
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem
            onSelect={() => navigateTo("/dashboard/settings?tab=teams")}
          >
            <UsersIcon className="size-4 mr-2" />
            Manage Teams
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigateTo("/dashboard/new")}>
            <CirclePlus className="size-4 mr-2" />
            Create Work Item
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/dashboard/settings")}>
            <SettingsIcon className="size-4 mr-2" />
            Settings
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/dashboard/integrations")}>
            <PlugIcon className="size-4 mr-2" />
            Integrations
            <ArrowRightIcon className="size-3 ml-auto text-muted-foreground" />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          }),
        )
      }
      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
    >
      <SearchIcon className="size-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
