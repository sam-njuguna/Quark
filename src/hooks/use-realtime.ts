"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";

export type PresenceEvent = 
  | "cursor_move" 
  | "card_move" 
  | "card_click" 
  | "typing"
  | "view_change"
  | "comment_added";

interface CursorPosition {
  x: number;
  y: number;
}

interface PresenceState {
  userId: string;
  userName: string;
  userImage?: string;
  cursor?: CursorPosition;
  view?: string;
  onlineAt: string;
}

interface OtherUser {
  id: string;
  name: string;
  image?: string;
  cursor?: CursorPosition;
  view?: string;
}

interface UseRealtimeOptions {
  teamId: string;
  userId: string;
  userName: string;
  userImage?: string;
  enabled?: boolean;
  onUserJoin?: (userId: string, user: OtherUser) => void;
  onUserLeave?: (userId: string) => void;
  onBroadcast?: (event: PresenceEvent, payload: unknown, fromUserId: string) => void;
}

export function useRealtime({
  teamId,
  userId,
  userName,
  userImage,
  enabled = true,
  onUserJoin,
  onUserLeave,
  onBroadcast,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OtherUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isConnectedRef = useRef(false);

  const onUserJoinRef = useRef(onUserJoin);
  const onUserLeaveRef = useRef(onUserLeave);
  const onBroadcastRef = useRef(onBroadcast);

  useLayoutEffect(() => {
    onUserJoinRef.current = onUserJoin;
    onUserLeaveRef.current = onUserLeave;
    onBroadcastRef.current = onBroadcast;
  });

  useEffect(() => {
    if (!teamId || !userId || !enabled) return;

    const channelName = `realtime:${teamId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const users: OtherUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (key !== userId && presences[0]) {
            users.push({
              id: key,
              name: presences[0].userName || "Unknown",
              image: presences[0].userImage,
              cursor: presences[0].cursor,
              view: presences[0].view,
            });
          }
        });

        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key !== userId && newPresences[0]) {
          onUserJoinRef.current?.(key, {
            id: key,
            name: newPresences[0].userName || "Unknown",
            image: newPresences[0].userImage,
          });
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== userId) {
          setOnlineUsers((prev) => prev.filter((u) => u.id !== key));
          onUserLeaveRef.current?.(key);
        }
      })
      .on("broadcast", { event: "*" }, ({ event, payload, userId: fromUserId }) => {
        if (fromUserId !== userId) {
          onBroadcastRef.current?.(event as PresenceEvent, payload, fromUserId);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          isConnectedRef.current = true;
          setIsConnected(true);
          await channel.track({
            userId,
            userName,
            userImage,
            onlineAt: new Date().toISOString(),
          });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          isConnectedRef.current = false;
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      isConnectedRef.current = false;
      channel.unsubscribe();
    };
  }, [teamId, userId, userName, userImage, enabled]);

  const broadcast = useCallback(
    (event: PresenceEvent, payload: Record<string, unknown>) => {
      if (!isConnectedRef.current) return;
      channelRef.current?.send({
        type: "broadcast",
        event,
        payload: { ...payload, userId, userName },
      });
    },
    [userId, userName]
  );

  const updatePresence = useCallback(
    (data: Partial<PresenceState>) => {
      if (!isConnectedRef.current) return;
      channelRef.current?.track({
        userId,
        userName,
        userImage,
        ...data,
        onlineAt: new Date().toISOString(),
      });
    },
    [userId, userName, userImage]
  );

  return {
    isConnected,
    onlineUsers,
    broadcast,
    updatePresence,
  };
}

export function useCursorTracking(enabled = true) {
  const [cursor, setCursor] = useState<CursorPosition | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [enabled]);

  return cursor;
}
