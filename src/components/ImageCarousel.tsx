import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { usePostMedia, type Post } from "@/lib/usePosts";
import { cn } from "@/lib/utils";

function CarouselSlide({ post }: { post: Post }) {
  const url = usePostMedia(post.media_url);
  return (
    <div className="relative h-56 w-full shrink-0 sm:h-72 lg:h-96">
      {url ? (
        <img
          src={url}
          alt={post.description || "RUGIRA showcase"}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      )}
      {post.description ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="line-clamp-2 text-sm font-medium text-white">{post.description}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ImageCarousel({ posts }: { posts: Post[] }) {
  const slides = posts.filter((p) => p.media_type === "image" && p.media_url);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-glass-border bg-muted/40">
        <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground sm:h-72 lg:h-96">
          New products will be showcased here soon.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-glass-border">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((p) => (
          <CarouselSlide key={p.id} post={p} />
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5 bg-background/80 py-2">
          {slides.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}