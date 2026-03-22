"use client";

import { useCallback } from "react";

interface CompressionOptions {
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number; // 0–1
  maxSizeBytes?: number;
}

export function useImageCompression(options: CompressionOptions = {}) {
  const {
    maxWidthPx = 1920,
    maxHeightPx = 1080,
    quality = 0.85,
    maxSizeBytes = 5 * 1024 * 1024,
  } = options;

  const compress = useCallback(
    async (file: File): Promise<File> => {
      if (!file.type.startsWith("image/")) return file;
      if (file.size <= maxSizeBytes && file.type === "image/webp") return file;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            if (width > maxWidthPx) {
              height = Math.round((height * maxWidthPx) / width);
              width = maxWidthPx;
            }
            if (height > maxHeightPx) {
              width = Math.round((width * maxHeightPx) / height);
              height = maxHeightPx;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(file);
                const compressed = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".webp"),
                  { type: "image/webp", lastModified: Date.now() },
                );
                resolve(compressed.size < file.size ? compressed : file);
              },
              "image/webp",
              quality,
            );
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    },
    [maxWidthPx, maxHeightPx, quality, maxSizeBytes],
  );

  return { compress };
}
