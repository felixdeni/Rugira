// src/components/PublicBlog.tsx
import { usePosts } from "@/lib/usePosts";
import { Card } from "@/components/ui";

export function PublicBlog() {
  const { posts, loading } = usePosts();

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          {post.media_url && (
            <img 
              src={post.media_url} 
              alt={post.description}
              className="max-h-96 w-full rounded-lg object-cover"
            />
          )}
          {post.description && (
            <p className="mt-3">{post.description}</p>
          )}
          {post.product_link && (
            <a 
              href={post.product_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-primary hover:underline"
            >
              View Product →
            </a>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </Card>
      ))}
    </div>
  );
}