"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addComment } from "@/actions/comments/add";
import { approveWork } from "@/actions/work/approve";
import { rejectWork } from "@/actions/work/reject";
import { blockWork } from "@/actions/work/block";
import { updateStage } from "@/actions/work/update-stage";
import { cloneWork } from "@/actions/work/clone";
import { deleteWork } from "@/actions/work/delete";
import type { Work } from "@/db/schema/work";
import {
  SendIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  CopyIcon,
  Trash2Icon,
  EyeIcon,
  PenIcon,
} from "lucide-react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface WorkDetailActionsProps {
  workId: string;
  work: Work;
  currentUserRole?: "member" | "lead" | "admin" | null;
}

export function WorkDetailActions({
  workId,
  work,
  currentUserRole,
}: WorkDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [previewComment, setPreviewComment] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const canManage =
    currentUserRole === "lead" ||
    currentUserRole === "admin" ||
    currentUserRole == null;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    startTransition(async () => {
      try {
        await addComment({ workId, content: comment });
        setComment("");
        toast.success("Comment added");
        router.refresh();
      } catch {
        toast.error("Failed to add comment");
      }
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveWork(workId);
        toast.success("Work approved");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to approve");
      }
    });
  };

  const handleReject = () => {
    if (!rejectFeedback.trim()) return;
    startTransition(async () => {
      try {
        await rejectWork(workId, rejectFeedback);
        setRejectFeedback("");
        setShowRejectForm(false);
        toast.success("Revision requested");
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to request revision",
        );
      }
    });
  };

  const handleBlock = () => {
    if (!blockReason.trim()) return;
    startTransition(async () => {
      try {
        await blockWork(workId, blockReason);
        setBlockReason("");
        setShowBlockForm(false);
        toast.success("Work marked as blocked");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to block work");
      }
    });
  };

  const handleStartWork = () => {
    startTransition(async () => {
      try {
        const nextStage = work.stage === "new" ? "triaged" : "in_progress";
        await updateStage(workId, nextStage);
        toast.success("Work updated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update work");
      }
    });
  };

  const handleClone = () => {
    startTransition(async () => {
      try {
        const cloned = await cloneWork(workId);
        toast.success("Work item cloned");
        router.push(`/dashboard/work/${cloned.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to clone work");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this work item? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteWork(workId);
        toast.success("Work item deleted");
        router.push("/dashboard/all");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete work");
      }
    });
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Stage actions */}
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {(work.stage === "new" || work.stage === "triaged") && (
            <Button
              onClick={handleStartWork}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              <PlayIcon className="mr-2 size-3.5" />
              {work.stage === "new" ? "Triage" : "Start Work"}
            </Button>
          )}

          {work.stage === "awaiting_review" && (
            <>
              <Button onClick={handleApprove} disabled={isPending} size="sm">
                <CheckCircleIcon className="mr-2 size-3.5" />
                Approve
              </Button>
              <Button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={isPending}
                size="sm"
                variant="outline"
              >
                <XCircleIcon className="mr-2 size-3.5" />
                Request Revision
              </Button>
            </>
          )}

          {["in_progress", "revision"].includes(work.stage) && (
            <Button
              onClick={() => setShowBlockForm(!showBlockForm)}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              <AlertTriangleIcon className="mr-2 size-3.5" />
              Mark Blocked
            </Button>
          )}
        </div>
      )}

      {showRejectForm && (
        <div className="space-y-2">
          <Textarea
            placeholder="Explain what needs to be changed..."
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleReject}
              disabled={isPending || !rejectFeedback.trim()}
              size="sm"
            >
              Submit Feedback
            </Button>
            <Button
              onClick={() => setShowRejectForm(false)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showBlockForm && (
        <div className="space-y-2">
          <Textarea
            placeholder="Explain why this is blocked..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleBlock}
              disabled={isPending || !blockReason.trim()}
              size="sm"
              variant="destructive"
            >
              Block Work
            </Button>
            <Button
              onClick={() => setShowBlockForm(false)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add comment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            Comment (markdown supported)
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => setPreviewComment((p) => !p)}
            disabled={!comment.trim()}
          >
            {previewComment ? (
              <>
                <PenIcon className="size-3" /> Edit
              </>
            ) : (
              <>
                <EyeIcon className="size-3" /> Preview
              </>
            )}
          </Button>
        </div>
        {previewComment && comment.trim() ? (
          <div className="min-h-[60px] rounded-md border bg-muted/30 px-3 py-2">
            <MarkdownPreview content={comment} />
          </div>
        ) : (
          <Textarea
            placeholder="Add a comment... (supports **bold**, *italic*, `code`, etc.)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        )}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleAddComment}
            disabled={isPending || !comment.trim()}
            size="sm"
          >
            <SendIcon className="mr-2 size-3.5" />
            Add Comment
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleClone}
              disabled={isPending}
              size="sm"
              variant="ghost"
            >
              <CopyIcon className="mr-2 size-3.5" />
              Clone
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="mr-2 size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
