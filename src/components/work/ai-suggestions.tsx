"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { aiTriage } from "@/actions/ai/triage";

interface AISuggestion {
  suggestedPriority?: number;
  suggestedType?: string;
  suggestedStage?: string;
  confidence?: number;
  reasoning?: string;
}

interface AISuggestionsProps {
  title: string;
  description?: string;
}

export function AISuggestions({ title, description }: AISuggestionsProps) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const data = await aiTriage({ title, description });
        setSuggestion(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [title, description]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2Icon className="size-3 animate-spin" />
        <span>AI analyzing...</span>
      </div>
    );
  }

  if (!suggestion?.confidence || suggestion.confidence < 0.5) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestion.suggestedPriority && (
        <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-300">
          <SparklesIcon className="size-3 text-amber-500" />
          P{suggestion.suggestedPriority} suggested
        </Badge>
      )}
      {suggestion.suggestedType && (
        <Badge variant="outline" className="gap-1 border-violet-500/50 text-violet-700 dark:text-violet-300">
          <SparklesIcon className="size-3 text-violet-500" />
          {suggestion.suggestedType}
        </Badge>
      )}
      {suggestion.suggestedStage && (
        <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-700 dark:text-emerald-300">
          <SparklesIcon className="size-3 text-emerald-500" />
          → {suggestion.suggestedStage}
        </Badge>
      )}
    </div>
  );
}
