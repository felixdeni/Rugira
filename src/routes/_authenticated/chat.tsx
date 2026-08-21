import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { useChatPartners, useConversation } from "@/lib/useChat";
import { saleDateTime } from "@/lib/rugira";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "RUGIRA Chat | Employee and Boss Messages" },
      { name: "description", content: "Private realtime chat between the RUGIRA employee and boss, saved securely." },
      { property: "og:title", content: "RUGIRA Chat" },
      { property: "og:description", content: "Private realtime messages between employee and boss." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { role, fullName, user } = useAuth();
  const { partners, loading: loadingPartners } = useChatPartners(user?.id, role);
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  const active = partnerId ?? partners[0]?.id;
  const { messages, loading, send } = useConversation(user?.id, active);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await send(text);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setText("");
  };

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Chat</h1>
          <p className="text-sm text-muted-foreground">
            {role === "boss" ? "Private messages with your employees" : "Private messages with your boss"}
          </p>
        </div>

        {partners.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {partners.map((p) => (
              <button
                key={p.id}
                onClick={() => setPartnerId(p.id)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                  active === p.id
                    ? "brand-gradient text-primary-foreground shadow-md shadow-primary/25"
                    : "border border-border bg-card/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : null}

        <Card className="flex h-[60dvh] flex-col gap-3 p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {loadingPartners || loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading conversation…
              </p>
            ) : !active ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessagesSquare className="size-4" /> No one to chat with yet.
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                        mine
                          ? "bg-primary/15 text-foreground"
                          : "bg-secondary/15 text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{saleDateTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form className="flex items-center gap-2" onSubmit={submit}>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              aria-label="Message"
              disabled={!active}
            />
            <Button type="submit" disabled={busy || !active || !text.trim()} aria-label="Send message">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}