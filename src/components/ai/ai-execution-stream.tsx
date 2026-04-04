"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SparklesIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LoaderIcon,
  CopyIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AIExecutionStreamProps {
  workId: string;
  agentId?: string;
  workTitle: string;
  onComplete?: (output: string) => void;
}

interface StreamEvent {
  type: string;
  content?: string;
  error?: string;
  done?: boolean;
}

export function AIExecutionStream({
  workId,
  agentId,
  workTitle,
  onComplete,
}: AIExecutionStreamProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "running" | "completed" | "error">("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "running") return;

    const eventSource = new EventSource(`/api/agents/${agentId}/stream?workId=${workId}&action=stream`);
    setStatus("connecting");

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        if (data.type === "chunk" && data.content) {
          setOutput((prev) => prev + data.content);
          setStatus("running");
        } else if (data.type === "error") {
          setError(data.error || "Unknown error");
          setStatus("error");
          eventSource.close();
        } else if (data.type === "done") {
          setStatus("completed");
          eventSource.close();
          onComplete?.(output);
        } else if (data.type === "start") {
          setStatus("running");
        }
      } catch (e) {
        console.error("Failed to parse SSE:", e);
      }
    };

    eventSource.onerror = () => {
      setError("Connection lost");
      setStatus("error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [workId, agentId, onComplete, output]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const statusConfig = {
    idle: { icon: null, label: "Ready", color: "text-muted-foreground" },
    connecting: { icon: LoaderIcon, label: "Connecting...", color: "text-blue-500" },
    running: { icon: LoaderIcon, label: "Running", color: "text-blue-500 animate-spin" },
    completed: { icon: CheckCircleIcon, label: "Completed", color: "text-emerald-500" },
    error: { icon: XCircleIcon, label: "Failed", color: "text-red-500" },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <SparklesIcon className="size-4 text-amber-500" />
            AI Execution
          </CardTitle>
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className={`size-4 ${config.color}`} />}
            <span className={`text-xs ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-mono whitespace-pre-wrap">
            {output || (
              <span className="text-muted-foreground italic">
                {status === "idle"
                  ? "Click 'Run AI' to start execution..."
                  : status === "connecting"
                  ? "Connecting to AI..."
                  : "Waiting for response..."}
              </span>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {output.length} characters
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyOutput}
              disabled={!output}
            >
              <CopyIcon className="size-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function useAIStream(workId: string, agentId?: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startStream = async () => {
    if (!agentId) {
      setError("No agent configured");
      return;
    }

    setIsStreaming(true);
    setError(null);
    setOutput("");

    try {
      const response = await fetch(`/api/agents/${agentId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stream", workId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            setIsStreaming(false);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "chunk" && parsed.content) {
              setOutput((prev) => prev + parsed.content);
            } else if (parsed.type === "error") {
              setError(parsed.error);
              setIsStreaming(false);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    isStreaming,
    output,
    error,
    startStream,
  };
}
