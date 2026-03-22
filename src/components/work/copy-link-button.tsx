"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? (
        <CheckIcon className="size-3.5 text-emerald-500" />
      ) : (
        <LinkIcon className="size-3.5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
