"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkReactions } from "@/components/work/work-reactions";
import { WorkSubTasks } from "@/components/work/work-subtasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/work/file-upload";
import { PdfViewer } from "@/components/work/pdf-viewer";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { assignWork } from "@/actions/work/assign";
import type { Work, WorkOutput } from "@/db/schema/work";
import type { SystemRole } from "@/actions/auth/session";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  MessageSquareIcon,
  PlayIcon,
  SendIcon,
  XCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  FileTextIcon,
  TagIcon,
  PaperclipIcon,
  ChevronsUpDownIcon,
  UserPlusIcon,
  UsersIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

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
  1: { label: "P1 - High", color: "text-red-600 dark:text-red-400" },
  2: { label: "P2 - Medium", color: "text-amber-600 dark:text-amber-400" },
  3: { label: "P3 - Low", color: "text-zinc-600 dark:text-zinc-400" },
};

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author?: { name: string | null; email: string } | null;
}

interface RecentViewer {
  userId: string;
  name: string | null;
  image: string | null;
  action: string;
  createdAt: Date;
}

interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: string;
  url: string;
  createdAt?: Date;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

interface WorkDetailSheetProps {
  work: Work & {
    outputs?: WorkOutput[];
    comments?: Comment[];
    recentViewers?: RecentViewer[];
    attachments?: Attachment[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (workId: string) => Promise<void>;
  onReject?: (workId: string, feedback: string) => Promise<void>;
  onBlock?: (workId: string, reason: string) => Promise<void>;
  onAddComment?: (workId: string, content: string) => Promise<void>;
  onDeleteAttachment?: (attachmentId: string) => Promise<void>;
  currentUserRole?: "member" | "lead" | "admin" | null;
  currentUserId?: string;
  systemRole?: SystemRole;
  availableUsers?: AvailableUser[];
  aiAgentInfo?: { id: string; name: string; agentType: string } | null;
}

export function WorkDetailSheet({
  work,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onBlock,
  onAddComment,
  onDeleteAttachment,
  currentUserRole,
  currentUserId,
  systemRole,
  availableUsers = [],
  aiAgentInfo,
}: WorkDetailSheetProps) {
  const router = useRouter();
  const canManage =
    currentUserRole === "lead" ||
    currentUserRole === "admin" ||
    currentUserRole == null;
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(
    work.attachments || [],
  );

  // Determine which users the current user can assign work to
  const assignableUsers = useMemo(() => {
    if (!currentUserId || availableUsers.length === 0) return [];

    const isSuperAdmin = systemRole === "super_admin";
    const isTeamAdmin = currentUserRole === "admin";

    // Admins and super admins can assign to anyone
    if (isSuperAdmin || isTeamAdmin) {
      return availableUsers;
    }

    // Leads can assign to team members (including themselves)
    if (currentUserRole === "lead") {
      return availableUsers;
    }

    // Members can only assign to themselves
    return availableUsers.filter((u) => u.id === currentUserId);
  }, [availableUsers, currentUserId, currentUserRole, systemRole]);

  // If AI is assigned, no one can manually reassign
  const isAiAssigned = !!aiAgentInfo || work.aiAgentId;

  const canAssignOthers = useMemo(() => {
    if (isAiAssigned) return false;
    const isSuperAdmin = systemRole === "super_admin";
    const isTeamAdmin = currentUserRole === "admin";
    const isLead = currentUserRole === "lead";
    return isSuperAdmin || isTeamAdmin || isLead;
  }, [currentUserRole, systemRole, isAiAssigned]);

  const handleAssign = async (userId: string) => {
    startTransition(async () => {
      try {
        await assignWork(work.id, userId);
        toast.success("Work assigned successfully");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to assign work",
        );
      }
    });
  };

  const currentAssignee = useMemo(() => {
    if (!work.assignedTo) return null;
    return availableUsers.find((u) => u.id === work.assignedTo);
  }, [work.assignedTo, availableUsers]);

  const handleApprove = () => {
    if (!onApprove) return;
    startTransition(async () => {
      await onApprove(work.id);
    });
  };

  const handleReject = () => {
    if (!onReject || !rejectFeedback.trim()) return;
    startTransition(async () => {
      await onReject(work.id, rejectFeedback);
      setRejectFeedback("");
      setShowRejectForm(false);
    });
  };

  const handleBlock = () => {
    if (!onBlock || !blockReason.trim()) return;
    startTransition(async () => {
      await onBlock(work.id, blockReason);
      setBlockReason("");
      setShowBlockForm(false);
    });
  };

  const handleAddComment = () => {
    if (!onAddComment || !comment.trim()) return;
    startTransition(async () => {
      await onAddComment(work.id, comment);
      setComment("");
    });
  };

  const handleUploadAttachment = useCallback((attachment: Attachment) => {
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      if (!onDeleteAttachment) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        return;
      }
      startTransition(async () => {
        await onDeleteAttachment(attachmentId);
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      });
    },
    [onDeleteAttachment, startTransition],
  );

  const priority = priorityLabels[work.priority || 2];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-lg p-0 h-full overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={typeColors[work.type]}>{work.type}</Badge>
              <Badge className={stageColors[work.stage]}>
                {stageLabels[work.stage]}
              </Badge>
              <span className={`text-xs font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>
          </div>
          <SheetTitle className="text-lg leading-snug">{work.title}</SheetTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {work.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                Due {format(new Date(work.dueDate), "MMM d, yyyy")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              Created {format(new Date(work.createdAt), "MMM d")}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Assignee Section - Show only AI or auto-assign status */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Assigned To
              </h4>
              {/* AI Agent Assigned - Show info */}
              {isAiAssigned ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-lg">🤖</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {aiAgentInfo?.name || "AI Agent"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {work.aiStatus === "running" ? "Processing..." : 
                       work.aiStatus === "completed" ? "Completed" : "Assigned to AI"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed">
                  <SparklesIcon className="size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    AI will auto-assign when work begins
                  </p>
                </div>
              )}
            </div>

            {/* Presence indicators */}
            {work.recentViewers && work.recentViewers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Recently active:</span>
                <div className="flex -space-x-1.5">
                  {work.recentViewers.slice(0, 4).map((v) => (
                    <Avatar
                      key={v.userId}
                      className="size-5 ring-1 ring-background"
                    >
                      <AvatarImage src={v.image ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {v.name?.slice(0, 2).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            {work.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Description
                </h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {work.description}
                </div>
              </div>
            )}

            {/* Instructions */}
            {work.instructions && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Instructions
                </h4>
                <div className="rounded-lg bg-muted/50 border p-3 text-sm whitespace-pre-wrap leading-relaxed">
                  {work.instructions}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            {work.successCriteria && work.successCriteria.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Success Criteria
                </h4>
                <ul className="space-y-1.5">
                  {work.successCriteria.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircleIcon className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reactions */}
            <WorkReactions workId={work.id} />

            {/* Sub-tasks */}
            <WorkSubTasks parentId={work.id} />

            {/* Attachments */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                <PaperclipIcon className="size-3.5" />
                Attachments
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {attachments.length}
                  </Badge>
                )}
              </h4>
              <FileUpload
                workId={work.id}
                attachments={attachments}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
                disabled={isPending}
              />
            </div>

            {/* Outputs */}
            {work.outputs && work.outputs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                  <FileTextIcon className="size-3.5" />
                  Submitted Output
                  <Badge variant="secondary" className="text-[10px]">
                    v{work.outputs[0].version}
                  </Badge>
                </h4>
                {work.outputs[0].contentType === "markdown" ? (
                  <div className="rounded-lg border bg-muted/30 p-4 max-h-80 overflow-y-auto">
                    <MarkdownPreview
                      content={
                        typeof work.outputs[0].content === "object" &&
                        "markdown" in work.outputs[0].content
                          ? String(work.outputs[0].content.markdown)
                          : typeof work.outputs[0].content === "object" &&
                            "text" in work.outputs[0].content
                          ? String(work.outputs[0].content.text)
                          : typeof work.outputs[0].content === "string"
                          ? String(work.outputs[0].content)
                          : JSON.stringify(work.outputs[0].content, null, 2)
                      }
                    />
                  </div>
                ) : work.outputs[0].contentType === "files" ? (
                  <div className="space-y-2">
                    {Array.isArray(work.outputs[0].content.files) ? (
                      work.outputs[0].content.files.map(
                        (
                          file: {
                            url: string;
                            filename: string;
                            contentType?: string;
                          },
                          index: number,
                        ) => (
                          <div key={index}>
                            {file.contentType === "application/pdf" ||
                            file.filename?.endsWith(".pdf") ? (
                              <PdfViewer
                                url={file.url}
                                filename={file.filename}
                              />
                            ) : (
                              <div className="rounded-lg border p-3 flex items-center gap-3">
                                <FileTextIcon className="size-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {file.filename}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a
                                    href={file.url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Download
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        ),
                      )
                    ) : (
                      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-foreground overflow-x-auto">
                          {JSON.stringify(work.outputs[0].content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-foreground overflow-x-auto">
                      {JSON.stringify(work.outputs[0].content, null, 2)}
                    </pre>
                  </div>
                )}
                {work.outputs.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {work.outputs.length - 1} earlier version
                    {work.outputs.length > 2 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Blocked Reason */}
            {work.stage === "blocked" && work.blockedReason && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangleIcon className="size-4" />
                  Blocked
                </h4>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  {work.blockedReason}
                </p>
              </div>
            )}

            <Separator />

            {/* Stage Status - Show AI auto-progress instead of manual controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Stage
              </h4>
              <div className="flex items-center gap-2">
                <Badge className={stageColors[work.stage]}>
                  {stageLabels[work.stage]}
                </Badge>
                {isAiAssigned && (
                  <span className="text-xs text-muted-foreground">
                    (AI auto-advances)
                  </span>
                )}
              </div>
              {isAiAssigned && work.aiProgress && (
                <div className="text-xs text-muted-foreground mt-2">
                  AI Progress: {Object.keys(work.aiProgress).length} stages completed
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                <MessageSquareIcon className="size-3.5" />
                Comments
                {work.comments && work.comments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {work.comments.length}
                  </Badge>
                )}
              </h4>

              {work.comments && work.comments.length > 0 && (
                <div className="space-y-2">
                  {work.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-muted/50 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar className="size-5">
                          <AvatarImage src={undefined} />
                          <AvatarFallback className="text-[8px]">
                            {(c.author?.name || c.author?.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs">
                          {c.author?.name || c.author?.email || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {format(new Date(c.createdAt), "MMM d 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm pl-7">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {onAddComment && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={isPending || !comment.trim()}
                    size="sm"
                  >
                    <SendIcon className="mr-2 size-3" />
                    Add Comment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
