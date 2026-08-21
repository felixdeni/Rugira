import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/useAuth";
import { categoryLabel, money, type SaleCategory } from "@/lib/rugira";

function notifyDevice(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/rugira-192.png", badge: "/icons/rugira-192.png" });
  } catch {
    /* some browsers require a service worker; the in-app toast still shows */
  }
}

export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission().catch(() => undefined);
}

async function nameOf(userId: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name || fallback;
}

/**
 * Real notifications from the live database:
 * - a new chat message addressed to the current user
 * - a new sale recorded by an employee (bosses only)
 */
export function useRealtimeNotifications(userId: string | undefined, role: Role | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !role) return;
    requestNotificationPermission();

    const channel = supabase
      .channel(`notify:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as {
            sender_id: string;
            body: string | null;
            media_type: string | null;
          };
          const who = await nameOf(row.sender_id, role === "boss" ? "Employee" : "Boss");
          const preview =
            row.media_type === "image"
              ? "Sent a photo"
              : row.media_type === "audio"
                ? "Sent a voice message"
                : (row.body ?? "").slice(0, 90) || "New message";
          toast.message(`New message from ${who}`, { description: preview });
          notifyDevice(`RUGIRA · ${who}`, preview);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        async (payload) => {
          const row = payload.new as {
            user_id: string;
            category: SaleCategory;
            quantity: number;
            gross: number | null;
          };
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["new-sim-stats"] });
          if (role !== "boss" || row.user_id === userId) return;
          const who = await nameOf(row.user_id, "Employee");
          const detail = `${who} · ${row.quantity} × ${categoryLabel(row.category)} · ${money(Number(row.gross ?? 0))}`;
          toast.success("New transaction recorded", { description: detail });
          notifyDevice("RUGIRA · New transaction", detail);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, queryClient]);
}
