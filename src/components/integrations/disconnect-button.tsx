"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, UnplugIcon } from "lucide-react";
import { disconnectIntegration } from "@/actions/integrations";
import { toast } from "sonner";

export function DisconnectButton({ integrationId }: { integrationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDisconnect = () => {
    if (!confirm("Disconnect this integration? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await disconnectIntegration(integrationId);
        toast.success("Integration disconnected");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to disconnect");
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 h-7 text-xs px-2.5 text-destructive border-destructive/30 hover:bg-destructive/5"
      onClick={handleDisconnect}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon className="size-3 animate-spin" />
      ) : (
        <UnplugIcon className="size-3" />
      )}
      Disconnect
    </Button>
  );
}
