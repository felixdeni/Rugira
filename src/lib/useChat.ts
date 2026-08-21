import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/useAuth";

export const CHAT_BUCKET = "chat-media";

export type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export type ChatPartner = { id: string; name: string };

/** Loads the people the current user can chat with: employees see bosses, bosses see employees. */
export function useChatPartners(userId: string | undefined, role: Role | null) {
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) return;
    let active = true;
    const wanted: Role = role === "boss" ? "employee" : "boss";
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", wanted);
      const ids = (roles ?? []).map((r) => r.user_id).filter((id) => id !== userId);
      if (ids.length === 0) {
        if (active) {
          setPartners([]);
          setLoading(false);
        }
        return;
      }
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      if (!active) return;
      setPartners(
        ids.map((id) => ({
          id,
          name: profiles?.find((p) => p.id === id)?.full_name || (wanted === "boss" ? "Boss" : "Employee"),
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, role]);

  return { partners, loading };
}

/** Uploads a chat attachment to secure private storage and returns its object path. */
export async function uploadChatMedia(userId: string, file: Blob, extension: string) {
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(CHAT_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/** Signed URL for a private chat attachment (valid for one hour). */
export async function signedMediaUrl(path: string) {
  const { data } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Realtime private conversation between the current user and one partner. */
export function useConversation(userId: string | undefined, partnerId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const pairKey = useMemo(() => `${userId ?? ""}|${partnerId ?? ""}`, [userId, partnerId]);

  useEffect(() => {
    if (!userId || !partnerId) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true });
      if (!active) return;
      setMessages((data ?? []) as unknown as ChatMessage[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`chat:${pairKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as ChatMessage;
          const inThread =
            (row.sender_id === userId && row.recipient_id === partnerId) ||
            (row.sender_id === partnerId && row.recipient_id === userId);
          if (!inThread) return;
          setMessages((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((m) => m.id !== row.id);
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row].sort((a, b) => a.created_at.localeCompare(b.created_at));
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId, pairKey]);

  const send = useCallback(
    async (input: {
      body?: string;
      mediaPath?: string | null;
      mediaType?: "image" | "audio" | null;
      durationSeconds?: number | null;
    }) => {
      if (!userId || !partnerId) return { error: "No conversation selected" };
      const text = (input.body ?? "").trim();
      if (!text && !input.mediaPath) return { error: "Message is empty" };
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: partnerId,
        body: text,
        media_url: input.mediaPath ?? null,
        media_type: input.mediaType ?? null,
        duration_seconds: input.durationSeconds ?? null,
      });
      return { error: error?.message ?? null };
    },
    [userId, partnerId],
  );

  return { messages, loading, send };
}
