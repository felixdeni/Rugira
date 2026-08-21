import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/Brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { isStandalone } from "@/lib/usePwaInstall";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to RUGIRA | Sales & Reports" },
      {
        name: "description",
        content: "Sign in to RUGIRA to record today's sales and view daily, weekly, monthly and yearly reports.",
      },
      { property: "og:title", content: "Sign in to RUGIRA" },
      { property: "og:description", content: "Employee and Boss access to RUGIRA sales records and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [gateOk, setGateOk] = useState(true);

  useEffect(() => {
    setGateOk(isStandalone() || localStorage.getItem("rugira-installed") === "true");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back to RUGIRA");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Wordmark />
        </div>

        {!gateOk ? (
          <Card className="flex items-start gap-3 border-accent/40">
            <ShieldCheck className="mt-0.5 size-5 text-accent-foreground" />
            <p className="text-sm text-muted-foreground">
              Install RUGIRA first for the full app experience.{" "}
              <Link to="/" className="font-semibold text-primary underline">
                Go to installation
              </Link>
            </p>
          </Card>
        ) : null}

        <Card className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use the account given to you by the Boss.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  className="pl-11"
                  placeholder="you@rugira.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">RUGIRA · Developed by Chanel</p>
      </div>
    </div>
  );
}
