/**
 * Feature flags system for Quark.
 * Set env vars to enable/disable features: FEATURE_<NAME>=true|false
 * Defaults are defined here and can be overridden per environment.
 */

const defaults: Record<string, boolean> = {
  TIME_TRACKING: true,
  CUSTOM_FIELDS: true,
  WORK_TEMPLATES: true,
  COMMENT_THREADING: true,
  GANTT_VIEW: true,
  BULK_ACTIONS: true,
  PUBLIC_SHARE: true,
  EMAIL_DIGEST: true,
  MENTION_NOTIFICATIONS: true,
  DASHBOARD_WIDGETS: true,
  ANALYTICS_V2: false,
  AB_TESTING: false,
};

export function isFeatureEnabled(flag: keyof typeof defaults): boolean {
  const envKey = `FEATURE_${flag}`;
  const envVal = process.env[envKey];
  if (envVal !== undefined) {
    return envVal === "true" || envVal === "1";
  }
  return defaults[flag] ?? false;
}

export const flags = {
  timeTracking: () => isFeatureEnabled("TIME_TRACKING"),
  customFields: () => isFeatureEnabled("CUSTOM_FIELDS"),
  workTemplates: () => isFeatureEnabled("WORK_TEMPLATES"),
  commentThreading: () => isFeatureEnabled("COMMENT_THREADING"),
  ganttView: () => isFeatureEnabled("GANTT_VIEW"),
  bulkActions: () => isFeatureEnabled("BULK_ACTIONS"),
  publicShare: () => isFeatureEnabled("PUBLIC_SHARE"),
  emailDigest: () => isFeatureEnabled("EMAIL_DIGEST"),
  mentionNotifications: () => isFeatureEnabled("MENTION_NOTIFICATIONS"),
  dashboardWidgets: () => isFeatureEnabled("DASHBOARD_WIDGETS"),
};
