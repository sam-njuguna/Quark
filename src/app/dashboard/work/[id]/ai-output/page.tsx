import { getWork } from "@/actions/work/get";
import { getSession, getUserTeams } from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { redirect, notFound } from "next/navigation";
import { ArrowLeftIcon, SparklesIcon, CopyIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { workStages } from "@/db/schema/work";
import { format } from "date-fns";

export default async function AIOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workId } = await params;
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  let workData;
  try {
    workData = await getWork(workId);
  } catch {
    notFound();
  }

  const outputs = workData.outputs || [];
  const latestOutput = outputs[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/work/${workId}`}>
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Work
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="size-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">{workData.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline">{workData.type}</Badge>
            <Badge variant="outline">{workData.stage}</Badge>
            {workData.aiStatus && (
              <Badge className={
                workData.aiStatus === "completed" ? "bg-emerald-100 text-emerald-700" :
                workData.aiStatus === "running" ? "bg-blue-100 text-blue-700" :
                "bg-zinc-100 text-zinc-700"
              }>
                AI: {workData.aiStatus}
              </Badge>
            )}
            {workData.aiCompletedAt && (
              <span>Completed {format(new Date(workData.aiCompletedAt), "PPp")}</span>
            )}
          </div>
        </div>

        {workData.description && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{workData.description}</p>
            </CardContent>
          </Card>
        )}

        {latestOutput ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <SparklesIcon className="size-4 text-amber-500" />
                  AI Output
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Version {latestOutput.version}
                  </span>
                  {latestOutput.content && typeof latestOutput.content === 'object' && 'model' in latestOutput.content && (
                    <Badge variant="outline" className="text-xs">
                      {String(latestOutput.content.model)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-6">
                <MarkdownPreview
                  content={
                    typeof latestOutput.content === "object" &&
                    "markdown" in latestOutput.content
                      ? String(latestOutput.content.markdown)
                      : JSON.stringify(latestOutput.content, null, 2)
                  }
                  className="prose-lg"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <SparklesIcon className="size-8 mx-auto mb-3 opacity-50" />
              <p>No AI output yet</p>
              <p className="text-sm mt-1">
                Assign this work to an AI agent to generate output
              </p>
            </CardContent>
          </Card>
        )}

        {outputs.length > 1 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outputs.slice(1).map((output) => (
                  <div
                    key={output.id}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50"
                  >
                    <span>Version {output.version}</span>
                    <span className="text-muted-foreground text-xs">
                      {output.createdAt ? format(new Date(output.createdAt), "PPp") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
