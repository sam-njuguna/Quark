"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

/* eslint-disable react-hooks/set-state-in-effect */
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (hasRun) return;
    setHasRun(true);

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setError("Invalid verification link");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setStatus("error");
          setError(data.message || "Verification failed");
          return;
        }

        setStatus("success");

        setTimeout(() => {
          const callbackUrl = searchParams.get("callbackUrl") || "/";
          router.push(callbackUrl);
        }, 1500);
      })
      .catch(() => {
        setStatus("error");
        setError("Something went wrong during verification");
      });
  }, [hasRun, router, searchParams]);

  return (
    <>
      <CardDescription>
        {status === "loading" && "Verifying your email..."}
        {status === "success" && "Email verified!"}
        {status === "error" && "Verification failed"}
      </CardDescription>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && <Spinner className="size-8" />}
        {status === "success" && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Redirecting to dashboard...
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </CardContent>
    </>
  );
}

function VerifyFallback() {
  return (
    <>
      <CardDescription>Verifying your email...</CardDescription>
      <CardContent className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
      </CardContent>
    </>
  );
}

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Quark</h1>
        <p className="text-sm text-muted-foreground">
          Multi-agent work orchestration platform
        </p>
      </div>
      <Card>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base">Verifying your sign-in</CardTitle>
        </CardHeader>
        <Suspense fallback={<VerifyFallback />}>
          <VerifyContent />
        </Suspense>
      </Card>
    </div>
  );
}
