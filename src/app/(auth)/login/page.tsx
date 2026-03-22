"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/sign-in/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send magic link");
        return;
      }

      setMessage("Check your email for a magic link to sign in.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Magic Link"}
      </Button>
    </form>
  );
}

function LoginFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" disabled />
      </div>
      <Button className="w-full" disabled>
        Loading...
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Q
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Quark
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send a magic link.
          </p>
        </div>
      </div>

      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>

      <p className="text-xs text-muted-foreground">
        By signing in, you agree to our terms of service.
      </p>
    </div>
  );
}
