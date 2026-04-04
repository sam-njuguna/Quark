"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchWork } from "@/actions/work/search";
import { semanticSearch } from "@/actions/search/semantic";
import {
  SearchIcon,
  InboxIcon,
  LayersIcon,
  UsersIcon,
  SettingsIcon,
  CirclePlus,
  ZapIcon,
  SparklesIcon,
} from "lucide-react";

const stageColors: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  triaged: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  awaiting_review: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  revision: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

const stageLabels: Record<string, string> = {
  new: "New", triaged: "Triaged", in_progress: "In Progress",
  awaiting_review: "Review", revision: "Revision",
  blocked: "Blocked", done: "Done", cancelled: "Cancelled",
};

type SearchResult = {
  id: string;
  title: string;
  type: string;
  stage: string;
  similarity?: number;
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSearch, setAiSearch] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchWork(q);
      setResults(res);
    } finally {
      setLoading(false);
    }
  }, []);

  const doAISearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await semanticSearch({ query: q, limit: 5 });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.startsWith("ai:")) {
        setAiSearch(true);
        doAISearch(query.slice(3).trim());
      } else {
        setAiSearch(false);
        doSearch(query);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, doSearch, doAISearch]);

  const nav = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-full max-w-[200px] justify-start gap-2 text-muted-foreground text-xs px-3"
      >
        <SearchIcon className="size-3.5 shrink-0" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
        <CommandInput
          placeholder="Search work items, navigate... (type 'ai:' for AI search)"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : query ? "No results found." : "Type to search work items."}
          </CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading={aiSearch ? "AI Search Results" : "Work items"}>
              {results.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.title}
                  onSelect={() => nav(`/dashboard/all?search=${encodeURIComponent(r.title)}`)}
                  className="gap-2"
                >
                  {aiSearch && <SparklesIcon className="size-4 text-amber-500" />}
                  <span className="truncate flex-1">{r.title}</span>
                  <Badge className={`${stageColors[r.stage]} border-0 text-[10px] shrink-0`}>
                    {stageLabels[r.stage]}
                  </Badge>
                  {r.similarity !== undefined && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                      {Math.round(r.similarity * 100)}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground capitalize shrink-0">{r.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.length > 0 && <CommandSeparator />}

          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => nav("/dashboard")} className="gap-2">
              <InboxIcon className="size-4" />
              My Work
            </CommandItem>
            <CommandItem onSelect={() => nav("/dashboard/all")} className="gap-2">
              <LayersIcon className="size-4" />
              All Work
            </CommandItem>
            <CommandItem onSelect={() => nav("/dashboard/team")} className="gap-2">
              <UsersIcon className="size-4" />
              Team
            </CommandItem>
            <CommandItem onSelect={() => nav("/dashboard/settings")} className="gap-2">
              <SettingsIcon className="size-4" />
              Settings
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => nav("/dashboard/new")} className="gap-2">
              <CirclePlus className="size-4" />
              Create new work
            </CommandItem>
            <CommandItem onSelect={() => nav("/dashboard/settings?tab=mcp")} className="gap-2">
              <ZapIcon className="size-4" />
              MCP configuration
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
