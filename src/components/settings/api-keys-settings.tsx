"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  KeyIcon,
  CirclePlus,
  Trash2Icon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return (
    "qk_" + Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
  );
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreated, setShowCreated] = useState(false);

  function handleCreate() {
    if (!newKeyName.trim()) return;
    const raw = generateApiKey();
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName.trim(),
      prefix: raw.slice(0, 10) + "…",
      createdAt: new Date(),
    };
    setKeys((prev) => [newKey, ...prev]);
    setCreatedKey(raw);
    setNewKeyName("");
    setCreateOpen(false);
    setShowCreated(false);
    toast.success("API key created — copy it now, it will not be shown again");
  }

  function handleDelete(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  }

  function handleCopy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create keys to access the Quark API programmatically.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <CirclePlus className="size-4 mr-1.5" aria-hidden="true" />
              New key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Give your key a descriptive name so you remember what it's used
                for.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. CI/CD pipeline"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newKeyName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {createdKey && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <KeyIcon className="size-4" aria-hidden="true" />
              Your new API key — copy it now
            </CardTitle>
            <CardDescription className="text-xs text-emerald-700 dark:text-emerald-300">
              This key will not be shown again. Store it securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-xs font-mono select-all">
                {showCreated ? createdKey : "•".repeat(createdKey.length)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreated((v) => !v)}
                aria-label={showCreated ? "Hide API key" : "Show API key"}
                className="size-8 shrink-0"
              >
                {showCreated ? (
                  <EyeOffIcon className="size-4" aria-hidden="true" />
                ) : (
                  <EyeIcon className="size-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(createdKey)}
                aria-label="Copy API key"
                className="size-8 shrink-0"
              >
                <CopyIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => setCreatedKey(null)}
            >
              I&apos;ve saved it, dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {keys.length === 0 && !createdKey ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <KeyIcon
            className="size-8 text-muted-foreground mb-3"
            aria-hidden="true"
          />
          <h3 className="text-sm font-medium">No API keys</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Create a key to integrate Quark with CI/CD pipelines, bots, or
            external tools.
          </p>
        </div>
      ) : (
        keys.length > 0 && (
          <div className="space-y-2">
            <Separator />
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <KeyIcon
                    className="size-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {key.prefix}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      Created {format(key.createdAt, "MMM d, yyyy")}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last used {format(key.lastUsedAt, "MMM d")}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={key.expiresAt ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {key.expiresAt
                      ? `Expires ${format(key.expiresAt, "MMM d")}`
                      : "No expiry"}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Revoke key "${key.name}"`}
                      >
                        <Trash2Icon className="size-4" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Any services using <strong>{key.name}</strong> will
                          stop working immediately. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoke key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
