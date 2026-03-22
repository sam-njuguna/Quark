"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { BellIcon, BellOffIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function PushNotificationsSettings() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BellOffIcon className="size-4" />
            Browser Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser does not support push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try a modern browser like Chrome, Firefox, or Edge to receive push
            notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon className="size-4" />
          Browser Push Notifications
        </CardTitle>
        <CardDescription>
          Receive instant notifications even when the page is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {isSubscribed ? "Notifications enabled" : "Notifications disabled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {permission === "denied"
                ? "Permission denied. Enable in browser settings."
                : isSubscribed
                  ? "You will receive push notifications for work updates."
                  : "Enable to receive push notifications for work updates."}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={permission === "denied"}
          />
        </div>
        {permission === "denied" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-xs text-destructive">
              Notifications are blocked. Please enable them in your browser
              site settings for this site.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className="text-xs"
        >
          {isSubscribed ? "Disable notifications" : "Enable notifications"}
        </Button>
      </CardContent>
    </Card>
  );
}
