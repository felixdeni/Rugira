import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const POST_BUCKET = "post-media";

export type Post = {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  product_link: string | null;
  description: string;
  created_at: string;
  updated_at: string;
};

/** Signed URL for a post attachment (valid for one hour). Works for logged-out visitors too. */
export async function postMediaUrl(path: string) {
  const { data } = await supabase.storage.from(POST_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function fileExtension(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5 && /^[a-z0-9]+$/i.test(fromName)) return fromName.toLowerCase();
  const fromType = file.type.split("/")[1]?.split(";")[0];
  return (fromType || "bin").toLowerCase();
}

/** Uploads a post photo or video to the post-media bucket (boss only, enforced by the database). */
export async function uploadPostMedia(userId: string, file: File) {
  const path = `${userId}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage.from(POST_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/** Real posts from the database, live-updated. Readable without signing in. */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { posts, loading, error, reload: load };
}

/** Resolves a private storage path to a temporary viewable URL. */
export function usePostMedia(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!path) return;
    postMediaUrl(path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [path]);
  return url;
}
