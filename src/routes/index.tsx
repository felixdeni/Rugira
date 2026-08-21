import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Download, Info, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/Brand";
import { Button, Card } from "@/components/ui";
import { INSTALL_STEPS, usePwaInstall } from "@/lib/usePwaInstall";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Install RUGIRA | Sales Recording & Reports" },
      {
        name: "description",
        content:
          "Install RUGIRA on your device to record daily SIM card, SIM swap and movies & songs sales and view earnings reports.",
      },
      { property: "og:title", content: "Install RUGIRA" },
      {
        property: "og:description",
        content: "Install the RUGIRA app first, then sign in to record sales and view reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InstallGate,
});

function InstallGate() {
  const navigate = useNavigate();
  const pwa = usePwaInstall();
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
    else toast.success("RUGIRA installed. You can continue to login.");
  };

  const steps = INSTALL_STEPS[pwa.platform];

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark subtitle={false} />
          <p className="text-sm text-muted-foreground">Developed by Chanel</p>
        </div>

        <Card className="space-y-5">
          {pwa.installed ? (
            <>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">RUGIRA is installed</h1>
                  <p className="text-sm text-muted-foreground">You can now continue to the login page.</p>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Continue to Login
                <ArrowRight className="size-5" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Smartphone className="mt-1 size-6 text-secondary" />
                <div>
                  <h1 className="text-xl font-bold">Install RUGIRA first</h1>
                  <p className="text-sm text-muted-foreground">
                    RUGIRA must be installed on this device before you can sign in.
                  </p>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={onInstall} disabled={busy || !pwa.ready}>
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
                Install RUGIRA
              </Button>

              {!pwa.canPrompt && pwa.ready ? (
                <div className="space-y-3 rounded-2xl bg-muted/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="size-4 text-secondary" />
                    {pwa.inIframe
                      ? "Open RUGIRA in its own browser tab to install it."
                      : "Automatic install is not available in this browser."}
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <Button variant="outline" size="sm" className="w-full" onClick={pwa.confirmManualInstall}>
                    <CheckCircle2 className="size-4" />
                    I have installed RUGIRA
                  </Button>
                </div>
              ) : null}

              {showSteps && pwa.canPrompt ? (
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              ) : null}
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Install RUGIRA → Login → Record today's sales → View reports
        </p>
      </div>
    </div>
  );
}
