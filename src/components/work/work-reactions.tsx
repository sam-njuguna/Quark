"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  toggleReaction,
  listReactions,
  getMyReactions,
} from "@/actions/reactions";
import { Button } from "@/components/ui/button";

const COMMON_EMOJIS = ["👍", "✅", "🔥", "❤️", "👀", "🚀", "💡", "⚠️"];

interface ReactionCount {
  emoji: string;
  count: number;
}

interface WorkReactionsProps {
  workId: string;
}

export function WorkReactions({ workId }: WorkReactionsProps) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const [all, mine] = await Promise.all([
        listReactions(workId),
        getMyReactions(workId),
      ]);
      setReactions(all);
      setMyReactions(mine);
    });
  }, [workId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (emoji: string) => {
    startTransition(async () => {
      await toggleReaction(workId, emoji);
      load();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggle(r.emoji)}
          disabled={isPending}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            myReactions.includes(r.emoji)
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-muted/50 hover:bg-muted"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-muted-foreground"
          onClick={() => setShowPicker((v) => !v)}
        >
          + React
        </Button>
        {showPicker && (
          <div className="absolute bottom-8 left-0 z-10 flex flex-wrap gap-1 rounded-lg border bg-popover p-2 shadow-md w-48">
            {COMMON_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  toggle(e);
                  setShowPicker(false);
                }}
                className="rounded p-1 text-lg hover:bg-muted"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
