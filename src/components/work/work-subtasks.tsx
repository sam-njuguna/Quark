"use client";

import { useState, useTransition } from "react";
import { createSubTask } from "@/actions/dependencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CirclePlus, CheckCircleIcon, CircleIcon } from "lucide-react";
import type { Work } from "@/db/schema/work";

interface WorkSubTasksProps {
  parentId: string;
  initialSubTasks?: Work[];
}

const stageIcon: Record<string, React.ReactNode> = {
  done: <CheckCircleIcon className="size-3.5 text-emerald-500" />,
};

export function WorkSubTasks({
  parentId,
  initialSubTasks = [],
}: WorkSubTasksProps) {
  const [subTasks, setSubTasks] = useState<Work[]>(initialSubTasks);
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const sub = await createSubTask(parentId, { title: title.trim() });
      setSubTasks((prev) => [...prev, sub]);
      setTitle("");
      setShowForm(false);
    });
  };

  const done = subTasks.filter((s) => s.stage === "done").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Sub-tasks {subTasks.length > 0 && `(${done}/${subTasks.length})`}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => setShowForm((v) => !v)}
        >
          <CirclePlus className="size-3" />
          Add
        </Button>
      </div>

      {subTasks.length > 0 && (
        <div className="space-y-1">
          {subTasks.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-xs"
            >
              {stageIcon[s.stage] ?? (
                <CircleIcon className="size-3.5 text-muted-foreground" />
              )}
              <span
                className={
                  s.stage === "done" ? "line-through text-muted-foreground" : ""
                }
              >
                {s.title}
              </span>
              <Badge
                variant="outline"
                className="ml-auto text-[10px] px-1 py-0"
              >
                {s.stage}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sub-task title..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isPending}
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleCreate}
            disabled={isPending || !title.trim()}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
