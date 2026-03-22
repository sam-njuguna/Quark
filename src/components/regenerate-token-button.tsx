"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { regenerateMcpToken } from "@/actions/api-keys/mcp-token";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface RegenerateTokenButtonProps {
  className?: string;
}

export function RegenerateTokenButton({
  className,
}: RegenerateTokenButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      await regenerateMcpToken();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleRegenerate}
      disabled={isLoading}
    >
      <RefreshCwIcon className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Regenerating..." : "Regenerate Token"}
    </Button>
  );
}
