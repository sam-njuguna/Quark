"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none text-sm overflow-x-hidden break-words
        [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 
        [&_p]:my-2 [&_p]:leading-relaxed
        [&_strong]:font-semibold
        [&_em]:italic [&_em]:text-muted-foreground
        [&_del]:line-through [&_del]:text-muted-foreground
        [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:break-all
        [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:break-all [&_pre]:whitespace-pre-wrap
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs [&_pre_code]:break-all
        [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
        [&_a]:text-primary [&_a]:underline 
        [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ul]:space-y-1 
        [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_ol]:space-y-1
        [&_li]:my-0.5
        [&_hr]:border-border [&_hr]:my-4 
        [&_table]:w-full [&_table]:my-3 [&_table]:text-xs [&_table]:break-words [&_table]:overflow-x-auto
        [&_thead]:bg-muted/50
        [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold
        [&_td]:px-2 [&_td]:py-1.5
        [&_tr]:border-b [&_tr]:border-border
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http") || href?.startsWith("https");
            if (isExternal) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              );
            }
            return (
              <Link href={href || "#"} {...props}>
                {children}
              </Link>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
