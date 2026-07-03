"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BdoLogo from "@/components/BdoLogo";
import { Mail, TriangleAlert, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function signInWithGoogle() {
    setLoading("google");
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <BdoLogo />
          <CardTitle className="pt-2">Deal Advisory AI Suite</CardTitle>
          <CardDescription>Sign in to access your saved engagements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Sign-in error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <Alert variant="info">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>
                We sent a sign-in link to <strong>{email}</strong>. Open it on
                this device to continue.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={signInWithEmail} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@bdo.am"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading !== null}>
                <Mail /> {loading === "email" ? "Sending…" : "Send sign-in link"}
              </Button>
            </form>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading !== null}
            onClick={signInWithGoogle}
          >
            {loading === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
