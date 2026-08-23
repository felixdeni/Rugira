import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  Facebook,
  Instagram,
  Link2,
  Loader2,
  LogIn,
  Menu,
  MessageCircle,
  PackageOpen,
  Phone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Brand";
import { Button, Card } from "@/components/ui";
import { INSTALL_STEPS, usePwaInstall } from "@/lib/usePwaInstall";
import { usePostMedia, usePosts, type Post } from "@/lib/usePosts";
import { saleDateTime } from "@/lib/rugira";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUGIRA | Phones, SIM Cards & Digital Services" },
      {
        name: "description",
        content:
          "Browse the latest RUGIRA products and offers — new SIM cards, SIM swap, movies & songs and phone services. Install the app or sign in as staff.",
      },
      { property: "og:title", content: "RUGIRA — Refresh" },
      {
        property: "og:description",
        content: "Latest RUGIRA products, offers and services. Install the app to stay updated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicFeed;
});

function PostCard({ post }: { post: Post }) {
  const url = usePostMedia(post.media_url);
  return (
    <Card className="space-y-3 p-4">
      <div className="overflow-hidden rounded-2xl bg-muted">
        {!url ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : post.media_type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={url} controls playsInline className="max-h-80 w-full object-cover" />
        ) : (
          <img
            src={url}
            alt={post.description || "RUGIRA product"}
            loading="lazy"
            className="max-h-80 w-full object-cover"
          />
        )}
      </div>
      {post.description ? <p className="whitespace-pre-wrap text-sm text-foreground">{post.description}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{saleDateTime(post.created_at)}</p>
        {post.product_link ? (
          <a href={post.product_link} target="_blank" rel="noreferrer">
            <Button size="sm">
              <Link2 className="size-4" /> View product
            </Button>
          </a>
        ) : null}
      </div>
    </Card>
  );
}

function PublicFeed() {
  const pwa = usePwaInstall();
  const { posts, loading } = usePosts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const onInstall = async () => {
    setBusy(true);
    const result = await pwa.install();
    setBusy(false);
    if (result === "unavailable") {
      setShowSteps(true);
      toast.info("Your browser handles installation manually — follow the steps shown.");
      return;
    }
    if (result === "dismissed") toast.error("Installation was cancelled.");
    else toast.success("RUGIRA installed.");
  };

  const steps = INSTALL_STEPS[pwa.platform];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-glass-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Logo className="size-9 rounded-xl" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-lg font-extrabold brand-text">RUGIRA</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent-foreground">Refresh</p>
          </div>
          <Link to="/auth" aria-label="Staff login">
            <Button size="sm" variant="outline">
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          </Link>
        </div>

        {menuOpen ? (
          <nav className="border-t border-glass-border bg-background/95 px-4 py-3">
            <ul className="mx-auto flex max-w-3xl flex-col gap-1 text-sm font-medium">
              <li>
                <a href="#feed" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">
                  Products
                </a>
              </li>
              <li>
                <a href="#install" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">
                  Install app
                </a>
              </li>
              <li>
                <a href="#contact" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">
                  Staff login
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold">Latest from RUGIRA</h1>
          <p className="text-sm text-muted-foreground">
            New SIM cards, SIM swap, movies &amp; songs and more — straight from the shop.
          </p>
        </section>

        {!pwa.installed ? (
          <Card id="install" className="space-y-3">
            <div className="flex items-start gap-3">
              <Download className="mt-1 size-5 text-primary" />
              <div>
                <h2 className="font-bold">Install the RUGIRA app</h2>
                <p className="text-sm text-muted-foreground">Get offers faster and open RUGIRA like a normal app.</p>
              </div>
            </div>
            <Button className="w-full" onClick={onInstall} disabled={busy || !pwa.ready}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
              Install RUGIRA
            </Button>
            {(showSteps || (!pwa.canPrompt && pwa.ready)) ? (
              <ol className="list-decimal space-y-1 rounded-2xl bg-muted/70 p-4 pl-8 text-sm text-muted-foreground">
                {steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            ) : null}
          </Card>
        ) : null}

        <section id="feed" className="space-y-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading products…
            </p>
          ) : posts.length === 0 ? (
            <Card className="flex items-center gap-3">
              <PackageOpen className="size-6 text-secondary" />
              <p className="text-sm text-muted-foreground">No products published yet. Check back soon.</p>
            </Card>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </section>
      </main>

      <footer id="contact" className="border-t border-glass-border bg-card/40 px-4 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Logo className="size-10 rounded-xl" />
          <p className="text-sm text-muted-foreground">RUGIRA — Refresh. Developed by Chanel.</p>
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/250780000000"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="rounded-xl bg-primary/10 p-3 text-primary hover:bg-primary/20"
            >
              <MessageCircle className="size-5" />
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-xl bg-primary/10 p-3 text-primary hover:bg-primary/20"
            >
              <Facebook className="size-5" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-xl bg-primary/10 p-3 text-primary hover:bg-primary/20"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href="tel:+250780000000"
              aria-label="Call RUGIRA"
              className="rounded-xl bg-primary/10 p-3 text-primary hover:bg-primary/20"
            >
              <Phone className="size-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RUGIRA</p>
        </div>
      </footer>
    </div>
  );
}
