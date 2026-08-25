import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  MapPin,
  Clock,
  ShoppingBag,
  Smartphone,
  Music,
  RefreshCw,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Brand";
import { Button, Card } from "@/components/ui";
import { ImageCarousel } from "@/components/ImageCarousel";
import { INSTALL_STEPS, usePwaInstall } from "@/lib/usePwaInstall";
import { usePostMedia, usePosts, type Post } from "@/lib/usePosts";
import { saleDateTime } from "@/lib/rugira";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUGIRA | Phones, SIM Cards & Digital Services" },
      {
        name: "description",
        content:
          "Browse the latest RUGIRA products and offers — new SIM cards, movies & songs and phone services. Install the app or sign in as staff.",
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
  component: PublicFeed,
});

function PostCard({ post }: { post: Post }) {
  const url = usePostMedia(post.media_url);
  return (
    <Card className="group overflow-hidden transition hover:shadow-lg">
      <div className="overflow-hidden rounded-t-2xl bg-muted">
        {!url ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : post.media_type === "video" ? (
          <video src={url} controls playsInline className="max-h-80 w-full object-cover" />
        ) : (
          <img
            src={url}
            alt={post.description || "RUGIRA product"}
            loading="lazy"
            className="max-h-80 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        {post.description ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
            {post.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{saleDateTime(post.created_at)}</p>
          {post.product_link ? (
            <a href={post.product_link} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <Link2 className="size-4" /> View product
              </Button>
            </a>
          ) : null}
        </div>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAuthenticated(true);
        window.location.href = '/dashboard';
      }
    });
  }, []);

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
    <div className="min-h-dvh bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-glass-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Logo className="size-9 rounded-xl" />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-lg font-extrabold brand-text">RUGIRA</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent-foreground">Refresh</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#feed" className="text-sm font-medium text-muted-foreground hover:text-foreground">Products</a>
            <a href="#install" className="text-sm font-medium text-muted-foreground hover:text-foreground">Install App</a>
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground">Services</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {!pwa.installed && (
              <Button size="sm" variant="outline" onClick={onInstall} disabled={busy || !pwa.ready} className="hidden sm:flex">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Install
              </Button>
            )}
            <Link to="/auth" aria-label="Staff login">
              <Button size="sm" variant={isAuthenticated ? "default" : "outline"}>
                <LogIn className="size-4" />
                <span className="hidden sm:inline">{isAuthenticated ? "Dashboard" : "Login"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {menuOpen ? (
          <nav className="border-t border-glass-border bg-background/95 px-4 py-3 lg:hidden">
            <ul className="mx-auto flex max-w-3xl flex-col gap-1 text-sm font-medium">
              <li><a href="#feed" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">Products</a></li>
              <li><a href="#install" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">Install App</a></li>
              <li><a href="#services" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">Services</a></li>
              <li><a href="#contact" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">Contact</a></li>
              <li>
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-muted">
                  {isAuthenticated ? "Dashboard" : "Staff login"}
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-primary">RUGIRA</span>
                <br />
                <span className="text-foreground">Your Shop</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                SIM Cards, Movies & Songs, and Others — All in one place.
              </p>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-primary/10 p-6 text-center transition hover:scale-105">
                  <Smartphone className="mx-auto size-8 text-primary" />
                  <p className="mt-2 text-sm font-medium">SIM Cards</p>
                  <p className="text-xs text-muted-foreground">New & Swap</p>
                </div>
                <div className="rounded-2xl bg-secondary/10 p-6 text-center transition hover:scale-105">
                  <Music className="mx-auto size-8 text-secondary" />
                  <p className="mt-2 text-sm font-medium">Movies & Songs</p>
                  <p className="text-xs text-muted-foreground">Latest collection</p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-6 text-center transition hover:scale-105">
                  <RefreshCw className="mx-auto size-8 text-accent" />
                  <p className="mt-2 text-sm font-medium">Others</p>
                  <p className="text-xs text-muted-foreground">Fast & Easy</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-6 text-center transition hover:scale-105">
                  <ShoppingBag className="mx-auto size-8 text-primary" />
                  <p className="mt-2 text-sm font-medium">Phone Software</p>
                  <p className="text-xs text-muted-foreground">Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

 <ImageCarousel posts={posts} />

      {/* Services Section */}
      <section id="services" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">About Our Shop</h2>
          <p className="mt-2 text-center text-muted-foreground">Everything you need, right here</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 transition hover:shadow-lg">
              <MapPin className="size-8 text-primary" />
              <h3 className="mt-4 font-semibold">Location</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Remera, Muhanga<br />
                Near Central Market
              </p>
            </Card>
            <Card className="p-6 transition hover:shadow-lg">
              <Clock className="size-8 text-primary" />
              <h3 className="mt-4 font-semibold">Opening Hours</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mon - Fri: 8:00 AM - 8:00 PM<br />
                Sat: 7:00 AM - 8:00 PM
              </p>
            </Card>
            <Card className="p-6 transition hover:shadow-lg">
              <Phone className="size-8 text-primary" />
              <h3 className="mt-4 font-semibold">Contact</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                +250 724 885 288<br />
                info@rugira.app
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
       

        <section className="space-y-2">
          <h2 id="feed" className="font-display text-2xl font-extrabold">Latest from RUGIRA</h2>
          <p className="text-sm text-muted-foreground">
            New SIM cards, movies &amp; songs and more — straight from the shop.
          </p>
        </section>

        {!pwa.installed ? (
          <Card id="install" className="space-y-3 border-primary/20 bg-primary/5">
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

        <section className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <PackageOpen className="size-8 text-muted-foreground/40" />
              <p className="ml-4 text-muted-foreground">No products yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-glass-border bg-card/40 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Logo className="size-10 rounded-xl" />
          <p className="text-sm text-muted-foreground">RUGIRA — Refresh. Developed by Chanel.</p>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/250780000000" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-xl bg-primary/10 p-3 text-primary transition hover:bg-primary/20">
              <MessageCircle className="size-5" />
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-xl bg-primary/10 p-3 text-primary transition hover:bg-primary/20">
              <Facebook className="size-5" />
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-xl bg-primary/10 p-3 text-primary transition hover:bg-primary/20">
              <Instagram className="size-5" />
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter" className="rounded-xl bg-primary/10 p-3 text-primary transition hover:bg-primary/20">
              <Twitter className="size-5" />
            </a>
            <a href="tel:+250780000000" aria-label="Call RUGIRA" className="rounded-xl bg-primary/10 p-3 text-primary transition hover:bg-primary/20">
              <Phone className="size-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RUGIRA</p>
        </div>
      </footer>
    </div>
  );
}