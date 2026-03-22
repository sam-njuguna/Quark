"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  GithubIcon,
  LinkIcon,
  GitPullRequestIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface LinkedPR {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed" | "merged";
}

interface GithubIntegrationProps {
  workId: string;
  linkedPRs?: LinkedPR[];
  repo?: string;
}

const STATE_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  closed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  merged:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export function GithubIntegration({
  workId,
  linkedPRs = [],
  repo,
}: GithubIntegrationProps) {
  const [prUrl, setPrUrl] = useState("");
  const [prs, setPrs] = useState<LinkedPR[]>(linkedPRs);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLink() {
    if (!prUrl.trim()) return;
    const match = prUrl.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (!match) {
      toast.error("Invalid GitHub PR URL");
      return;
    }

    setIsLoading(true);
    try {
      // In production: call a server action that uses GitHub API to fetch PR details
      // and stores the link in the database linked to workId
      const prNumber = parseInt(match[1]);
      setPrs((prev) => [
        ...prev,
        {
          number: prNumber,
          title: `Pull Request #${prNumber}`,
          url: prUrl.trim(),
          state: "open",
        },
      ]);
      setPrUrl("");
      toast.success("PR linked successfully");
    } catch {
      toast.error("Failed to link PR");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <GithubIcon className="size-4" aria-hidden="true" />
          GitHub
        </CardTitle>
        <CardDescription className="text-xs">
          Link pull requests and commits to this work item
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor={`github-pr-${workId}`} className="sr-only">
              GitHub PR URL
            </Label>
            <Input
              id={`github-pr-${workId}`}
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              className="h-8 text-xs"
              aria-label="Link a GitHub pull request"
            />
          </div>
          <Button
            size="sm"
            onClick={handleLink}
            disabled={isLoading || !prUrl.trim()}
            className="h-8"
          >
            <LinkIcon className="size-3 mr-1" aria-hidden="true" />
            Link
          </Button>
        </div>

        {repo && (
          <p className="text-xs text-muted-foreground">
            Repository: <span className="font-mono">{repo}</span>
          </p>
        )}

        {prs.length > 0 && (
          <>
            <Separator />
            <ul className="space-y-2" aria-label="Linked pull requests">
              {prs.map((pr) => (
                <li
                  key={pr.number}
                  className="flex items-start justify-between gap-2 rounded-md border px-2.5 py-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <GitPullRequestIcon
                      className="size-3.5 mt-0.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{pr.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{pr.number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATE_COLORS[pr.state]}`}
                    >
                      {pr.state}
                    </span>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Open PR #${pr.number} on GitHub`}
                    >
                      <ExternalLinkIcon className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {prs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No pull requests linked yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
