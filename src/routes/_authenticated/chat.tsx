import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Mic, MessagesSquare, Send, Square, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { signedMediaUrl, uploadChatMedia, useChatPartners, useConversation, type ChatMessage } from "@/lib/useChat";
import { saleDateTime, saleTime } from "@/lib/rugira";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "RUGIRA Chat | Employee and Boss Messages" },
      { name: "description", content: "Private realtime chat between the RUGIRA employee and boss with photos and voice notes." },
      { property: "og:title", content: "RUGIRA Chat" },
      { property: "og:description", content: "Private realtime messages, photos and voice notes between employee and boss." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function MediaBubble({ message }: { message: ChatMessage }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!message.media_url) return;
    signedMediaUrl(message.media_url).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [message.media_url]);

  if (!url) {
    return (
      <p className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Loading attachment…
      </p>
    );
  }

  if (message.media_type === "image") {
    return <img src={url} alt="Shared photo" loading="lazy" className="max-h-64 rounded-xl object-cover" />;
  }

  return (
    <div className="space-y-1">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={url} className="w-56 max-w-full" />
      {message.duration_seconds ? (
        <p className="text-[11px] text-muted-foreground">{Math.round(Number(message.duration_seconds))}s voice message</p>
      ) : null}
    </div>
  );
}

function ChatPage() {
  const { role, fullName, user } = useAuth();
  const { partners, loading: loadingPartners } = useChatPartners(user?.id, role);
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  const active = partnerId ?? partners[0]?.id;
  const { messages, loading, send } = useConversation(user?.id, active);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds(Math.round((Date.now() - startedAtRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [recording]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !active) return;
    if (!text.trim() && !image) return;
    setBusy(true);
    try {
      let mediaPath: string | null = null;
      if (image) {
        const ext = (image.name.split(".").pop() || "jpg").toLowerCase();
        const up = await uploadChatMedia(user.id, image, ext);
        if (up.error || !up.path) {
          toast.error(up.error ?? "Upload failed");
          return;
        }
        mediaPath = up.path;
      }
      const { error } = await send({
        body: text,
        mediaPath,
        mediaType: mediaPath ? "image" : null,
      });
      if (error) {
        toast.error(error);
        return;
      }
      setText("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording is not supported on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (!user?.id || !active) return;
        setBusy(true);
        try {
          const up = await uploadChatMedia(user.id, blob, "webm");
          if (up.error || !up.path) {
            toast.error(up.error ?? "Upload failed");
            return;
          }
          const { error } = await send({ mediaPath: up.path, mediaType: "audio", durationSeconds: duration });
          if (error) toast.error(error);
        } finally {
          setBusy(false);
        }
      };
      startedAtRef.current = Date.now();
      setSeconds(0);
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
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

        <Card className="flex h-[64dvh] flex-col gap-3 p-0">
          <div className="chat-wallpaper flex-1 space-y-2 overflow-y-auto rounded-t-3xl p-4">
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
                        "max-w-[80%] space-y-1 rounded-2xl px-3 py-2 text-sm shadow-sm",
                        mine
                          ? "rounded-br-sm bg-primary/20 text-foreground"
                          : "rounded-bl-sm bg-card text-foreground",
                      )}
                    >
                      {m.media_url ? <MediaBubble message={m} /> : null}
                      {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
                      <p className="text-right text-[11px] text-muted-foreground" title={saleDateTime(m.created_at)}>
                        {saleTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {image ? (
            <div className="mx-4 flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-3 py-2 text-sm">
              <ImagePlus className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">{image.name}</span>
              <button type="button" onClick={() => setImage(null)} aria-label="Remove photo">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          ) : null}

          <form className="flex items-center gap-2 p-3" onSubmit={submit}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!active || recording}
              onClick={() => fileRef.current?.click()}
              aria-label="Attach photo"
            >
              <ImagePlus className="size-5" />
            </Button>

            {recording ? (
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-foreground">
                <span className="size-2 animate-pulse rounded-full bg-destructive" />
                Recording… {seconds}s
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(e);
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                aria-label="Message"
                disabled={!active}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card/70 px-4 py-3 text-base outline-none transition focus:border-secondary focus:ring-2 focus:ring-ring/40"
              />
            )}

            {recording ? (
              <Button type="button" variant="danger" onClick={stopRecording} aria-label="Stop and send voice message">
                <Square className="size-4" />
              </Button>
            ) : text.trim() || image ? (
              <Button
                type="submit"
                disabled={busy || !active}
                aria-label="Send message"
                className="size-12 rounded-full p-0"
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 translate-x-[1px]" />}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={busy || !active}
                onClick={startRecording}
                aria-label="Record voice message"
                className="size-12 rounded-full p-0"
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
              </Button>
            )}
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
