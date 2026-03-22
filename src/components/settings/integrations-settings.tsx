"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  GithubIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  fields: Array<{ id: string; label: string; placeholder: string; type?: string }>;
  docsUrl: string;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Link pull requests and commits to work items. Auto-update stages when PRs merge.",
    icon: <GithubIcon className="size-5" aria-hidden="true" />,
    connected: false,
    docsUrl: "https://docs.github.com/en/apps/oauth-apps",
    fields: [
      { id: "github_org", label: "Organisation / User", placeholder: "my-org" },
      { id: "github_token", label: "Personal Access Token", placeholder: "ghp_...", type: "password" },
      { id: "github_repo", label: "Default Repository (optional)", placeholder: "my-org/my-repo" },
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync work item due dates to your Google Calendar automatically.",
    icon: <CalendarIcon className="size-5" aria-hidden="true" />,
    connected: false,
    docsUrl: "https://developers.google.com/calendar/api/guides/auth",
    fields: [
      { id: "gcal_client_id", label: "OAuth Client ID", placeholder: "....apps.googleusercontent.com" },
      { id: "gcal_client_secret", label: "OAuth Client Secret", placeholder: "GOCSPX-...", type: "password" },
      { id: "gcal_calendar_id", label: "Calendar ID (optional)", placeholder: "primary" },
    ],
  },
];

export function IntegrationsSettings() {
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  function handleField(integrationId: string, fieldId: string, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] ?? {}), [fieldId]: value },
    }));
  }

  async function handleSave(integration: IntegrationConfig) {
    setSaving(integration.id);
    try {
      // In production: POST to /api/integrations/:id with config values (encrypted server-side)
      await new Promise((r) => setTimeout(r, 600));
      setConnected((prev) => ({ ...prev, [integration.id]: true }));
      setEnabled((prev) => ({ ...prev, [integration.id]: true }));
      toast.success(`${integration.name} connected`);
    } catch {
      toast.error(`Failed to connect ${integration.name}`);
    } finally {
      setSaving(null);
    }
  }

  function handleDisconnect(integration: IntegrationConfig) {
    setConnected((prev) => ({ ...prev, [integration.id]: false }));
    setEnabled((prev) => ({ ...prev, [integration.id]: false }));
    setConfigs((prev) => ({ ...prev, [integration.id]: {} }));
    toast.success(`${integration.name} disconnected`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Quark to external services to automate your workflow.
        </p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected[integration.id] ?? integration.connected;
          const isEnabled = enabled[integration.id] ?? false;
          const fields = configs[integration.id] ?? {};
          const isSaving = saving === integration.id;

          return (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">{integration.name}</CardTitle>
                        {isConnected ? (
                          <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300">
                            <CheckCircleIcon className="size-3" aria-hidden="true" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                            <XCircleIcon className="size-3" aria-hidden="true" />
                            Not connected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">{integration.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected && (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(v) => setEnabled((prev) => ({ ...prev, [integration.id]: v }))}
                        aria-label={`Enable ${integration.name} integration`}
                      />
                    )}
                    <a
                      href={integration.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`${integration.name} documentation`}
                    >
                      <ExternalLinkIcon className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </CardHeader>

              {!isConnected && (
                <CardContent className="space-y-3">
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {integration.fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <Label htmlFor={`${integration.id}-${field.id}`} className="text-xs">
                          {field.label}
                        </Label>
                        <Input
                          id={`${integration.id}-${field.id}`}
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          value={fields[field.id] ?? ""}
                          onChange={(e) => handleField(integration.id, field.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSave(integration)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Connecting…" : `Connect ${integration.name}`}
                    </Button>
                  </div>
                </CardContent>
              )}

              {isConnected && (
                <CardContent>
                  <Separator className="mb-3" />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(integration)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
