"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WORK_TEMPLATES, type WorkTemplate } from "@/lib/work-templates";
import { LayoutTemplateIcon, CheckIcon } from "lucide-react";

interface WorkTemplatePickerProps {
  onSelect: (template: WorkTemplate) => void;
}

export function WorkTemplatePicker({ onSelect }: WorkTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(template: WorkTemplate) {
    setSelected(template.id);
    onSelect(template);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <LayoutTemplateIcon className="size-3.5" />
          Use template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
          {WORK_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className={`group relative rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected === template.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              {selected === template.id && (
                <CheckIcon className="absolute top-3 right-3 size-4 text-primary" />
              )}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{template.icon}</span>
                <span className="font-medium text-sm">{template.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">
                  {template.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {template.successCriteria.length} criteria
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
