import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, LogIn, Mail, ShieldCheck, UserPlus, Bug, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ============================================
  // DEBUG: Check Supabase Configuration
  // ============================================
  useEffect(() => {
    console.log("🔍 ===== SUPABASE CONFIGURATION CHECK =====");
    console.log("🔍 Supabase client exists:", !!supabase);
    
    // Check environment variables
    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      SUPABASE_PUBLISHABLE_KEY: import.meta.env.SUPABASE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing",
    };
    console.log("🔍 Environment Variables:", envVars);
    
    // Try to get Supabase URL and key from client
    if (supabase) {
      // @ts-ignore - Access internal properties for debugging
      const clientUrl = supabase?.supabaseUrl || "Unknown";
      // @ts-ignore - Access internal properties for debugging
      const clientKey = supabase?.supabaseKey ? "✅ Set" : "❌ Missing";
      console.log("🔍 Supabase client URL:", clientUrl);
      console.log("🔍 Supabase client key:", clientKey);
      
      setDebugInfo(`URL: ${clientUrl}\nKey: ${clientKey}`);
    }

    setGateOk(isStandalone() || localStorage.getItem("rugira-installed") === "true");
    
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem("rugira-email");
    const savedPassword = localStorage.getItem("rugira-password");
    const savedRemember = localStorage.getItem("rugira-remember") === "true";
    
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) {
        setPassword(savedPassword);
      }
      setRememberMe(true);
    }
    
    // Check current session
    if (supabase) {
      supabase.auth.getSession()
        .then(({ data, error }) => {
          if (error) {
            console.error("❌ Session check error:", error);
            return;
          }
          if (data.session) {
            console.log("✅ User already logged in:", data.session.user.email);
            navigate({ to: "/dashboard" });
          } else {
            console.log("ℹ️ No active session found");
          }
        })
        .catch(err => {
          console.error("❌ Session check failed:", err);
        });
    }
  }, [navigate]);

  // ============================================
  // DEBUG: Check if user exists
  // ============================================
  const checkUserExists = async () => {
    if (!email) {
      toast.error("Please enter an email first");
      return;
    }

    setBusy(true);
    try {
      console.log("🔍 Checking if user exists:", email);
      
      // Try to check if user exists by attempting a password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        if (error.message.includes("User not found")) {
          toast.error(`❌ User "${email}" does not exist in Supabase Auth`);
          setDebugInfo(`User "${email}" does NOT exist in the database.`);
        } else {
          console.log("ℹ️ Reset password response:", error.message);
          toast.info(`User exists but: ${error.message}`);
          setDebugInfo(`User exists: ${error.message}`);
        }
      } else {
        toast.success(`✅ User "${email}" exists! Check your email for reset link.`);
        setDebugInfo(`✅ User "${email}" exists in the database.`);
      }
    } catch (err) {
      console.error("❌ Error checking user:", err);
      toast.error("Error checking user existence");
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // DEBUG: Create test user
  // ============================================
  const createTestUser = async () => {
    setBusy(true);
    try {
      console.log("🔍 Creating test user...");
      
      const { data, error } = await supabase.auth.signUp({
        email: 'ganelvibes0@gmail.com',
        password: 'TestPassword123!',
        options: {
          data: {
            full_name: 'Chanel Developer',
          },
        },
      });

      if (error) {
        console.error("❌ Error creating user:", error);
        
        if (error.message.includes("User already registered")) {
          toast.info("User already exists. Try logging in.");
          setDebugInfo("User already exists in Supabase Auth.");
        } else {
          toast.error("Failed to create user: " + error.message);
          setDebugInfo(`Creation failed: ${error.message}`);
        }
      } else {
        console.log("✅ User created successfully!", data);
        toast.success("User created! You can now log in.");
        setDebugInfo(`✅ User created: ${data.user?.email}`);
        setEmail('ganelvibes0@gmail.com');
        setPassword('TestPassword123!');
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // MAIN LOGIN FUNCTION
  // ============================================
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Validate inputs
    if (!email || email.trim() === "") {
      toast.error("Please enter your email address");
      setBusy(false);
      return;
    }

    if (!password || password === "") {
      toast.error("Please enter your password");
      setBusy(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      setBusy(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setBusy(false);
      return;
    }

    if (!supabase) {
      toast.error("Authentication service is not available. Please try again later.");
      setBusy(false);
      return;
    }

    // ============================================
    // ATTEMPT LOGIN
    // ============================================
    try {
      console.log("🔍 ===== LOGIN ATTEMPT =====");
      console.log("🔍 Email:", email.trim());
      console.log("🔍 Password length:", password.length);
      console.log("🔍 Supabase client:", supabase ? "Available" : "Not available");
      
      // @ts-ignore - Get Supabase URL for debugging
      console.log("🔍 Supabase URL:", supabase?.supabaseUrl || "Unknown");
      
      const startTime = Date.now();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      const endTime = Date.now();
      console.log(`🔍 Request took: ${endTime - startTime}ms`);

      // Handle error
      if (signInError) {
        console.error("❌ Supabase login error:", signInError);
        console.error("❌ Error details:", {
          status: signInError.status,
          message: signInError.message,
          name: signInError.name,
          code: signInError.code,
        });

        // Detailed error messages
        let errorMessage = signInError.message;
        let debugMessage = "";

        if (signInError.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
          debugMessage = "Invalid credentials - user might not exist or password is wrong";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address. Check your inbox for the confirmation link.";
          debugMessage = "Email not confirmed in Supabase Auth";
        } else if (signInError.message.includes("rate limit")) {
          errorMessage = "Too many failed attempts. Please wait a few minutes and try again.";
          debugMessage = "Rate limited by Supabase";
        } else if (signInError.message.includes("not found")) {
          errorMessage = "No account found with this email. Please check your email address.";
          debugMessage = "User not found in Supabase Auth";
        } else if (signInError.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
          debugMessage = "Network error";
        } else if (signInError.message.includes("Invalid Refresh Token")) {
          errorMessage = "Session expired. Please log in again.";
          debugMessage = "Refresh token invalid";
        }

        setError(errorMessage);
        setDebugInfo(`❌ ${debugMessage || signInError.message}`);
        toast.error(errorMessage);
        setBusy(false);
        return;
      }

      // Check user data
      if (!data?.user) {
        console.error("❌ No user data returned");
        toast.error("Login failed. No user data returned.");
        setDebugInfo("❌ No user data from Supabase");
        setBusy(false);
        return;
      }

      console.log("✅ Login successful!");
      console.log("✅ User ID:", data.user.id);
      console.log("✅ User Email:", data.user.email);
      console.log("✅ Session:", data.session ? "✅ Active" : "❌ No session");
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rugira-email", email.trim());
        localStorage.setItem("rugira-password", password);
        localStorage.setItem("rugira-remember", "true");
      } else {
        localStorage.removeItem("rugira-email");
        localStorage.removeItem("rugira-password");
        localStorage.removeItem("rugira-remember");
      }
      
      toast.success("Welcome back to RUGIRA! 🎉");
      setDebugInfo(`✅ Login successful: ${data.user.email}`);
      
      // Navigate after session is saved
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 500);

    } catch (err) {
      console.error("❌ Unexpected login error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setDebugInfo(`❌ Unexpected error: ${message}`);
      toast.error("Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Wordmark />
        </div>

        {/* Back to Home Link */}
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" />
          Back to Home
        </Link>

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
                  disabled={busy}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="pl-11 pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Remember me
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1" disabled={busy}>
                {busy ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
                {busy ? "Signing in..." : "Sign in"}
              </Button>
              
              
            </div>



            {showDebug && debugInfo && (
              <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
                <pre className="whitespace-pre-wrap break-all">{debugInfo}</pre>
              </div>
            )}
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">RUGIRA · Developed by Chanel</p>
      </div>
    </div>
  );
}