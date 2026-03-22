"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const PUSH_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscriptionJSON | null;
  isLoading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    
    if (!isSupported) {
      setState((prev) => ({ ...prev, isSupported, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isSupported }));

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((subscription) => {
        setState((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
          subscription: subscription?.toJSON() ?? null,
          isLoading: false,
        }));
      })
      .catch((error) => {
        console.error("Failed to check existing subscription:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  const subscribe = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!PUSH_VAPID_PUBLIC_KEY) {
        console.warn("VAPID public key not configured");
        toast.error("Push notifications not configured");
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subscriptionJSON = subscription.toJSON();

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionJSON),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setState({
        isSupported: true,
        isSubscribed: true,
        subscription: subscriptionJSON,
        isLoading: false,
      });

      toast.success("Push notifications enabled");
      return subscriptionJSON;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Failed to enable push notifications");
      return null;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        const endpoint = subscription.endpoint;
        await fetch("/api/notifications/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setState({
        isSupported: true,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      });

      toast.success("Push notifications disabled");
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to disable push notifications");
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    permission: typeof window !== "undefined" ? Notification.permission : "default",
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
