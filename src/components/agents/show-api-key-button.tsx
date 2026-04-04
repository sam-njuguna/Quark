"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CopyIcon, EyeIcon, EyeClosedIcon } from "lucide-react";

export function ShowApiKeyButton({ apiKey }: { apiKey: string }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <EyeIcon className="size-4 mr-1" />
          Show API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agent API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this key to authenticate external agents. Keep it secure!
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={showKey ? apiKey : "•".repeat(apiKey.length)}
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeClosedIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={copyKey}>
              <CopyIcon className="size-4" />
            </Button>
          </div>
          {copied && <p className="text-sm text-emerald-600">Copied to clipboard!</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
