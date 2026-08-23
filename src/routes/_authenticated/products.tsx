import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Link2, Loader2, PackagePlus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { usePostMedia, usePosts, uploadPostMedia, type Post } from "@/lib/usePosts";
import { saleDateTime } from "@/lib/rugira";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "RUGIRA Products | Manage Client Posts" },
      {
        name: "description",
        content: "Boss-only page to publish product photos and videos with a link and description to the RUGIRA public feed.",
      },
      { property: "og:title", content: "RUGIRA Products" },
      { property: "og:description", content: "Publish and manage product posts shown on the public RUGIRA feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function PostRow({ post, onDelete }: { post: Post; onDelete: (p: Post) => void }) {
  const url = usePostMedia(post.media_url);
  return (
    <Card className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-muted">
        {!url ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : post.media_type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={url} controls className="max-h-64 w-full object-cover" />
        ) : (
          <img src={url} alt={post.description || "Product"} loading="lazy" className="max-h-64 w-full object-cover" />
        )}
      </div>
      {post.description ? <p className="whitespace-pre-wrap text-sm">{post.description}</p> : null}
      {post.product_link ? (
        <a
          href={post.product_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          <Link2 className="size-4" /> Product link
        </a>
      ) : null}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{saleDateTime(post.created_at)}</p>
        <Button variant="danger" size="sm" onClick={() => onDelete(post)}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>
    </Card>
  );
}

function ProductsPage() {
  const { role, fullName, user } = useAuth();
  const { posts, loading } = usePosts();
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  if (role && role !== "boss") {
    return (
      <AppShell role={role} name={fullName}>
        <Card className="flex items-center gap-3">
          <ShieldAlert className="size-6 text-accent-foreground" />
          <p className="text-sm">Only the boss can manage products.</p>
        </Card>
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !file) {
      toast.error("Choose a photo or video first");
      return;
    }
    setBusy(true);
    try {
      const up = await uploadPostMedia(user.id, file);
      if (up.error || !up.path) {
        toast.error(up.error ?? "Upload failed");
        return;
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        media_url: up.path,
        media_type: file.type.startsWith("video") ? "video" : "image",
        product_link: link.trim() || null,
        description: description.trim(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Post published to the public feed");
      setFile(null);
      setLink("");
      setDescription("");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (post: Post) => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("post-media").remove([post.media_url]);
    toast.success("Post deleted");
  };

  return (
    <AppShell role={role} name={fullName}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Publish products clients see on the RUGIRA home feed.</p>
        </div>

        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Photo or video">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-4 text-sm">
                <ImagePlus className="size-5 text-primary" />
                <span className="min-w-0 flex-1 truncate">{file ? file.name : "Choose a photo or video"}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>
            <Field label="Product link (optional)">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the product…"
                className="w-full resize-none rounded-2xl border border-input bg-card/70 px-4 py-3 text-base outline-none transition focus:border-secondary focus:ring-2 focus:ring-ring/40"
              />
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <PackagePlus className="size-5" />}
              Publish post
            </Button>
          </form>
        </Card>

        <h2 className="text-lg font-bold">Published posts</h2>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading posts…
          </p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <PostRow key={p.id} post={p} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
