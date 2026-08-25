import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePostMedia, usePosts, type Post } from "@/lib/usePosts";

export const Route = createFileRoute("/_authenticated/posts")({
  ssr: false,
  component: PostsPage,
});

function MyPostThumb({ post, onDelete }: { post: Post; onDelete: (p: Post) => void }) {
  const url = usePostMedia(post.media_url);
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {url ? (
          post.media_type === "video" ? (
            <video src={url} className="h-full w-full object-cover" muted />
          ) : (
            <img src={url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm">{post.description || "No description"}</p>
        {post.product_link ? (
          <a href={post.product_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">
            <Link2 className="size-3" /> Product link
          </a>
        ) : null}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onDelete(post)} aria-label="Delete post">
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </Card>
  );
}

function PostsPage() {
  const navigate = useNavigate();
  const { user, role, name, loading: authLoading } = useAuth();
  const { posts, loading: postsLoading, refetch } = usePosts();

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [productLink, setProductLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "boss") {
    navigate({ to: "/dashboard" });
    return null;
  }

  const myPosts = posts.filter((p) => p.author_id === user?.id);

  const resetForm = () => {
    setFile(null);
    setDescription("");
    setProductLink("");
    const input = document.getElementById("post-media-input") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const mediaTypeFromFile = (f: File): "image" | "video" | "audio" | "document" => {
    if (f.type.startsWith("image/")) return "image";
    if (f.type.startsWith("video/")) return "video";
    if (f.type.startsWith("audio/")) return "audio";
    return "document";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose an image or video to upload.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        media_url: path,
        media_type: mediaTypeFromFile(file),
        description: description.trim() || null,
        product_link: productLink.trim() || null,
      });
      if (insertError) throw insertError;

      toast.success("Post published.");
      resetForm();
      await refetch?.();
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (post: Post) => {
    if (!confirm("Delete this post?")) return;
    try {
      await supabase.storage.from("post-media").remove([post.media_url]);
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      toast.success("Post deleted.");
      await refetch?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post.");
    }
  };

  return (
    <AppShell role={role} name={name ?? ""}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Publish product photos or videos to the public landing page.
          </p>
        </div>

        <Card className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Image or video">
              <input
                id="post-media-input"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-2xl file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
              />
            </Field>

            <Field label="Description">
              <Textarea
                placeholder="Describe the product or offer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field label="Product link (optional)">
              <Input
                type="url"
                placeholder="https://..."
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
              />
            </Field>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              Publish post
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your posts</h2>
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : myPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't published anything yet.</p>
          ) : (
            <div className="space-y-2">
              {myPosts.map((p) => (
                <MyPostThumb key={p.id} post={p} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}