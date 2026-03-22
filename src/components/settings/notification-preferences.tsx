"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveNotificationPreferences } from "@/actions/notifications/preferences";
import type { NotificationPreferences } from "@/actions/notifications/preferences";

interface NotificationPreferencesProps {
  initialPrefs: NotificationPreferences;
}

interface PrefItem {
  key: keyof NotificationPreferences;
  label: string;
  desc?: string;
}

const EMAIL_PREFS: PrefItem[] = [
  { key: "emailWorkAssigned", label: "Work assigned to you", desc: "When a work item is assigned to you" },
  { key: "emailWorkSubmitted", label: "Work submitted for review", desc: "When an agent submits work for your approval" },
  { key: "emailWorkApproved", label: "Work approved", desc: "When your submitted work is approved" },
  { key: "emailRevisionRequested", label: "Revision requested", desc: "When a reviewer requests changes" },
  { key: "emailWorkBlocked", label: "Work blocked", desc: "When a work item you own is blocked" },
  { key: "emailMentionInComment", label: "Mentions in comments", desc: "When someone @mentions you" },
  { key: "emailDailyDigest", label: "Daily digest", desc: "A summary of activity sent each morning" },
  { key: "emailMuteAll", label: "Mute all email notifications", desc: "Override — silences all other email notifications" },
];

const INAPP_PREFS: PrefItem[] = [
  { key: "inappWorkAssigned", label: "Work assigned to you" },
  { key: "inappWorkReview", label: "Work ready for review" },
  { key: "inappWorkBlocked", label: "Work blocked" },
  { key: "inappNewComments", label: "New comments on your work" },
  { key: "inappWorkCancelled", label: "Work cancelled" },
];

export function NotificationPreferencesForm({
  initialPrefs,
}: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    startTransition(async () => {
      try {
        await saveNotificationPreferences({ [key]: value });
        toast.success("Preference saved");
      } catch {
        toast.error("Failed to save preference");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0 divide-y">
        {EMAIL_PREFS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3"
          >
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              {item.desc && (
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              )}
            </div>
            <Switch
              checked={initialPrefs[item.key] as boolean}
              onCheckedChange={(v) => handleToggle(item.key, v)}
              disabled={isPending}
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
          In-App
        </p>
        <div className="space-y-0 divide-y">
          {INAPP_PREFS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3"
            >
              <p className="text-sm font-medium">{item.label}</p>
              <Switch
                checked={initialPrefs[item.key] as boolean}
                onCheckedChange={(v) => handleToggle(item.key, v)}
                disabled={isPending}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
