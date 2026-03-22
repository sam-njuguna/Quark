"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";

interface CursorPosition {
  x: number;
  y: number;
}

interface PresenceState {
  userId: string;
  userName: string;
  cursor?: CursorPosition;
  online_at?: string;
}

interface OtherCursor {
  id: string;
  name: string;
  cursor: CursorPosition;
}

interface UsePresenceOptions {
  teamId: string;
  userId: string;
  userName: string;
  onCardMove?: (workId: string, stage: string) => void;
  onUserJoin?: (userId: string, userName: string) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (userId: string, cursor: CursorPosition) => void;
}

export function usePresence({
  teamId,
  userId,
  userName,
  onCardMove,
  onUserJoin,
  onUserLeave,
  onCursorUpdate,
}: UsePresenceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<
    { id: string; name: string }[]
  >([]);
  const [otherCursors, setOtherCursors] = useState<OtherCursor[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isConnectedRef = useRef(false);

  const onCardMoveRef = useRef(onCardMove);
  const onUserJoinRef = useRef(onUserJoin);
  const onUserLeaveRef = useRef(onUserLeave);
  const onCursorUpdateRef = useRef(onCursorUpdate);
  useLayoutEffect(() => {
    onCardMoveRef.current = onCardMove;
    onUserJoinRef.current = onUserJoin;
    onUserLeaveRef.current = onUserLeave;
    onCursorUpdateRef.current = onCursorUpdate;
  });

  useEffect(() => {
    if (!teamId || !userId) return;

    const channelName = `team:${teamId}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const users: { id: string; name: string }[] = [];
        const cursors: OtherCursor[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (key !== userId && presences[0]) {
            users.push({
              id: key,
              name: presences[0].userName || "Unknown",
            });
            if (presences[0].cursor) {
              cursors.push({
                id: key,
                name: presences[0].userName || "Unknown",
                cursor: presences[0].cursor,
              });
            }
          }
        });

        setOnlineUsers(users);
        setOtherCursors(cursors);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key !== userId && newPresences[0]) {
          onUserJoinRef.current?.(key, newPresences[0].userName || "Unknown");
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== userId) {
          setOtherCursors((prev) => prev.filter((c) => c.id !== key));
          onUserLeaveRef.current?.(key);
        }
      })
      .on("broadcast", { event: "card_move" }, ({ payload }) => {
        if (payload.userId !== userId) {
          onCardMoveRef.current?.(payload.workId, payload.stage);
        }
      })
      .on("broadcast", { event: "cursor_move" }, ({ payload }) => {
        if (payload.userId !== userId && payload.cursor) {
          setOtherCursors((prev) => {
            const existing = prev.find((c) => c.id === payload.userId);
            if (existing) {
              return prev.map((c) =>
                c.id === payload.userId ? { ...c, cursor: payload.cursor } : c,
              );
            }
            const state = channel.presenceState<PresenceState>();
            const presences = state[payload.userId];
            const name = presences?.[0]?.userName ?? "Unknown";
            return [
              ...prev,
              { id: payload.userId, name, cursor: payload.cursor },
            ];
          });
          onCursorUpdateRef.current?.(payload.userId, payload.cursor);
        }
      })
      .subscribe(async (status) => {
        console.log("[usePresence] channel status:", status);
        if (status === "SUBSCRIBED") {
          isConnectedRef.current = true;
          setIsConnected(true);
          await channel.track({
            userId,
            userName,
            online_at: new Date().toISOString(),
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
  }, [teamId, userId, userName]);

  const broadcastCardMove = useCallback(
    (workId: string, stage: string) => {
      if (!isConnectedRef.current) return;
      channelRef.current?.send({
        type: "broadcast",
        event: "card_move",
        payload: { workId, stage, userId },
      });
    },
    [userId],
  );

  const broadcastCursor = useCallback(
    (cursor: CursorPosition) => {
      if (!isConnectedRef.current) return;
      channelRef.current?.send({
        type: "broadcast",
        event: "cursor_move",
        payload: { cursor, userId },
      });
    },
    [userId],
  );

  return {
    isConnected,
    onlineUsers,
    otherCursors,
    broadcastCardMove,
    broadcastCursor,
  };
}
