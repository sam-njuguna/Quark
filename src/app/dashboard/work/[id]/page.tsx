import { getWork } from "@/actions/work/get";
import { getWorkAttachments } from "@/actions/work/attachments";
import { getSession, getUserTeams } from "@/actions/auth/session";
import { getTeamMembers } from "@/actions/team/members";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkDetailActions } from "@/components/work/work-detail-actions";
import { CopyLinkButton } from "@/components/work/copy-link-button";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MessageSquareIcon,
  PaperclipIcon,
  SendIcon,
  UserIcon,
  AlertTriangleIcon,
  VideoIcon,
  GitBranchIcon,
  GithubIcon,
} from "lucide-react";

const typeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  meeting:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  research: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  code: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  document: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  communication:
    "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

const stageColors: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  triaged: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  awaiting_review:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  revision:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const stageLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  revision: "Revision",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "P1 · High", color: "text-red-600 dark:text-red-400" },
  2: { label: "P2 · Medium", color: "text-amber-600 dark:text-amber-400" },
  3: { label: "P3 · Low", color: "text-zinc-500 dark:text-zinc-400" },
};

interface WorkPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/login");

  let workData: Awaited<ReturnType<typeof getWork>> | null = null;

  try {
    workData = await getWork(id);
  } catch {
    notFound();
  }

  if (!workData) notFound();

  const attachments = await getWorkAttachments(id).catch(() => []);
  const teams = await getUserTeams(session.user.id);
  const currentTeam = teams[0];
  const teamMembers = currentTeam ? await getTeamMembers(currentTeam.id) : [];
  const currentMember = teamMembers.find((m) => m.user.id === session.user!.id);
  const currentUserRole =
    (currentMember?.role as "member" | "lead" | "admin") ?? null;

  const priority = priorityLabels[workData.priority || 2];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/work/${id}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6 max-sm:px-4">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          asChild
        >
          <Link href="/dashboard/all">
            <ArrowLeftIcon className="size-3.5" />
            All Work
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={shareUrl} />
          <Button variant="outline" size="sm" asChild>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="mr-1.5 size-3.5" />
              Open
            </a>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              typeColors[workData.type],
              "text-[10px] font-semibold uppercase tracking-wide px-2 py-0",
            )}
          >
            {workData.type}
          </Badge>
          <Badge
            className={cn(
              stageColors[workData.stage],
              "text-[10px] font-semibold uppercase tracking-wide px-2 py-0",
            )}
          >
            {stageLabels[workData.stage]}
          </Badge>
          <span className={`text-xs font-semibold ${priority.color}`}>
            {priority.label}
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight leading-snug">
          {workData.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            Created {format(new Date(workData.createdAt), "MMM d, yyyy")}
          </span>
          {workData.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {workData.type === "meeting" ? "" : "Due "}
              {format(
                new Date(workData.dueDate),
                workData.type === "meeting"
                  ? "MMM d, yyyy 'at' h:mm a"
                  : "MMM d, yyyy",
              )}
            </span>
          )}
          {workData.meetingUrl && (
            <a
              href={workData.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
            >
              <VideoIcon className="size-3" />
              Join meeting
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {workData.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {workData.description}
                </p>
              </CardContent>
            </Card>
          )}

          {workData.instructions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 whitespace-pre-wrap font-mono text-xs">
                  {workData.instructions}
                </div>
              </CardContent>
            </Card>
          )}

          {workData.successCriteria && workData.successCriteria.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Success Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {workData.successCriteria.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Meeting card */}
          {workData.type === "meeting" && workData.meetingUrl && (
            <Card className="border-violet-200 dark:border-violet-900/40 bg-violet-50/30 dark:bg-violet-900/10">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="size-4 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        Video Meeting
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {workData.meetingUrl}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                    asChild
                  >
                    <a
                      href={workData.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <VideoIcon className="size-3" />
                      Join
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GitHub issue link */}
          {workData.githubIssueUrl && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GithubIcon className="size-4 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">GitHub Issue</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {workData.githubRepo ?? workData.githubIssueUrl}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    asChild
                  >
                    <a
                      href={workData.githubIssueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GithubIcon className="size-3" />
                      View issue
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Code linking guide */}
          {workData.type === "code" && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <GitBranchIcon className="size-3.5" />
                  Link your code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Name your Git branch after this work item to auto-link commits
                  and PRs:
                </p>
                <code className="block bg-muted rounded px-3 py-2 font-mono text-xs select-all">
                  work/{workData.id}
                </code>
                <p className="text-xs text-muted-foreground/60">
                  When a PR is opened or merged on this branch, Quark will
                  automatically update this work item.
                </p>
              </CardContent>
            </Card>
          )}

          {workData.stage === "blocked" && workData.blockedReason && (
            <Card className="border-red-200 dark:border-red-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertTriangleIcon className="size-4" />
                  Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workData.blockedReason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Outputs */}
          {workData.outputs && workData.outputs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileTextIcon className="size-4" />
                  Submitted Output
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    v{workData.outputs[0].version}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-foreground overflow-x-auto">
                    {typeof workData.outputs[0].content === "object" &&
                    "text" in workData.outputs[0].content
                      ? String(workData.outputs[0].content.text)
                      : JSON.stringify(workData.outputs[0].content, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <PaperclipIcon className="size-4" />
                  Attachments ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5"
                    >
                      <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {att.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {att.size}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquareIcon className="size-4" />
                Comments ({workData.comments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workData.comments && workData.comments.length > 0 ? (
                  workData.comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {c.author?.name || c.author?.email || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(c.createdAt), "MMM d 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No comments yet.
                  </p>
                )}
                <WorkDetailActions
                  workId={id}
                  currentUserRole={currentUserRole}
                  work={workData}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/20">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Details
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {[
                {
                  label: "Stage",
                  value: (
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${stageColors[workData.stage]}`}
                    >
                      {stageLabels[workData.stage]}
                    </span>
                  ),
                },
                {
                  label: "Priority",
                  value: (
                    <span className={`text-xs font-semibold ${priority.color}`}>
                      {priority.label}
                    </span>
                  ),
                },
                {
                  label: "Type",
                  value: (
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${typeColors[workData.type]}`}
                    >
                      {workData.type}
                    </Badge>
                  ),
                },
                ...(workData.dueDate
                  ? [
                      {
                        label: workData.type === "meeting" ? "When" : "Due",
                        value: (
                          <span className="text-xs">
                            {format(
                              new Date(workData.dueDate),
                              workData.type === "meeting"
                                ? "MMM d 'at' h:mm a"
                                : "MMM d, yyyy",
                            )}
                          </span>
                        ),
                      },
                    ]
                  : []),
                ...(workData.meetingUrl
                  ? [
                      {
                        label: "Join",
                        value: (
                          <a
                            href={workData.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                          >
                            <VideoIcon className="size-3" />
                            Open link
                          </a>
                        ),
                      },
                    ]
                  : []),
                ...(workData.submittedAt
                  ? [
                      {
                        label: "Submitted",
                        value: (
                          <span className="flex items-center gap-1 text-xs">
                            <SendIcon className="size-3" />
                            {format(new Date(workData.submittedAt), "MMM d")}
                          </span>
                        ),
                      },
                    ]
                  : []),
                ...(workData.completedAt
                  ? [
                      {
                        label: "Completed",
                        value: (
                          <span className="flex items-center gap-1 text-xs">
                            <CheckCircleIcon className="size-3 text-emerald-500" />
                            {format(new Date(workData.completedAt), "MMM d")}
                          </span>
                        ),
                      },
                    ]
                  : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                >
                  <span className="text-muted-foreground">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>

          {workData.recentViewers && workData.recentViewers.length > 0 && (
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Viewers
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {workData.recentViewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Avatar className="size-5 shrink-0">
                      <AvatarImage src={v.image ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {v.name?.slice(0, 2).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-xs text-muted-foreground truncate">
                      {v.name ?? "Unknown"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {v.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/20">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Share
              </p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Share this work item with a public link.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                asChild
              >
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="size-3" />
                  Open public link
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
