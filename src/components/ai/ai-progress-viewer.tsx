"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SparklesIcon,
  CheckCircleIcon,
  LoaderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface AIProgress {
  triaged?: { content: string; timestamp: string };
  in_progress?: { content: string; timestamp: string };
  awaiting_review?: { content: string; timestamp: string };
  done?: { content: string; timestamp: string };
}

interface AIProgressViewerProps {
  workId: string;
  aiProgress?: AIProgress;
  currentStage: string;
  aiStatus?: string;
}

const stageLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  done: "Done",
};

const stageOrder = ["triaged", "in_progress", "awaiting_review", "done"];

export function AIProgressViewer({
  workId,
  aiProgress,
  currentStage,
  aiStatus,
}: AIProgressViewerProps) {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<AIProgress | null>(aiProgress || null);

  useEffect(() => {
    if (!progress && workId) {
      setLoading(true);
      fetch(`/api/work/${workId}/ai-progress`)
        .then((res) => res.json())
        .then((data) => {
          if (data.aiProgress) {
            setProgress(data.aiProgress);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [workId, progress]);

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  const currentStageIndex = stageOrder.indexOf(currentStage);

  if (!progress || Object.keys(progress).length === 0) {
    if (aiStatus === "running") {
      return (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <LoaderIcon className="size-4 text-blue-500 animate-spin" />
              AI is working...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The AI is currently processing this work item. Check back soon for progress updates.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <SparklesIcon className="size-4 text-amber-500" />
          AI Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stageOrder.map((stage, index) => {
            const stageKey = stage as keyof AIProgress;
            const stageProgress = progress?.[stageKey];
            const isActive = index <= currentStageIndex;
            const isCurrent = stage === currentStage;
            const isExpanded = expandedStages[stage];

            return (
              <div
                key={stage}
                className={`rounded-lg border ${
                  isActive
                    ? "bg-card"
                    : "bg-muted/30 opacity-50"
                }`}
              >
                <button
                  onClick={() => stageProgress && toggleStage(stage)}
                  disabled={!stageProgress}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {stageProgress ? (
                      isExpanded ? (
                        <ChevronDownIcon className="size-4" />
                      ) : (
                        <ChevronRightIcon className="size-4" />
                      )
                    ) : (
                      <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isCurrent ? "text-blue-600" : ""
                      }`}
                    >
                      {stageLabels[stage]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stageProgress && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(stageProgress.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                    {isCurrent && aiStatus === "running" && (
                      <LoaderIcon className="size-4 text-blue-500 animate-spin" />
                    )}
                    {stageProgress && (
                      <Badge variant="outline" className="text-xs">
                        Done
                      </Badge>
                    )}
                  </div>
                </button>

                {isExpanded && stageProgress && (
                  <div className="px-3 pb-3">
                    <div className="rounded-lg border bg-muted/30 p-3 max-h-64 overflow-y-auto">
                      <MarkdownPreview content={stageProgress.content} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {currentStage === "done" && progress.done && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
              <CheckCircleIcon className="size-4" />
              <span className="text-sm font-medium">Final Output Complete</span>
            </div>
            <div className="rounded-lg bg-background p-3 max-h-80 overflow-y-auto">
              <MarkdownPreview content={progress.done.content} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
