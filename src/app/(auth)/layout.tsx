import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 relative"
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(0.60 0.04 285 / 0.18) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-[360px] relative z-10">{children}</div>
    </div>
  );
}
