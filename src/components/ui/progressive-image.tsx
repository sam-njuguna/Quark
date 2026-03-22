"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps extends Omit<ImageProps, "onLoad"> {
  blurClassName?: string;
}

export function ProgressiveImage({
  className,
  blurClassName,
  alt,
  ...props
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {!loaded && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-muted",
            blurClassName,
          )}
          aria-hidden="true"
        />
      )}
      <Image
        {...props}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}
