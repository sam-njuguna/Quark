"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KanbanCard } from "./kanban-card";
import { WorkDetailSheet } from "@/components/work/work-detail-sheet";
import type { Work } from "@/db/schema/work";
import type { SystemRole } from "@/actions/auth/session";
import { updateStage } from "@/actions/work/update-stage";
import { approveWork } from "@/actions/work/approve";
import { rejectWork } from "@/actions/work/reject";
import { blockWork } from "@/actions/work/block";
import { addComment } from "@/actions/comments/add";
import { getWork } from "@/actions/work/get";
import { getMyRoleInAnyTeam } from "@/actions/team/role";
import { getSystemRole } from "@/actions/auth/session";
import { getTeamMemberWorkloads } from "@/actions/work/analytics";
import { assignWork } from "@/actions/work/assign";
import { getTeamMembers } from "@/actions/team/members";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  UserPlusIcon,
} from "lucide-react";

type WorkDetail = Awaited<ReturnType<typeof getWork>>;
type UserRole = "member" | "lead" | "admin" | null;

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

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

const stageTransitions: Record<string, string[]> = {
  new: ["triaged", "cancelled"],
  triaged: ["in_progress", "blocked", "cancelled"],
  in_progress: ["awaiting_review", "blocked", "cancelled"],
  awaiting_review: ["revision", "done", "cancelled"],
  revision: ["in_progress", "awaiting_review", "blocked", "cancelled"],
  blocked: ["in_progress", "triaged", "cancelled"],
  done: [],
  cancelled: [],
};

interface KanbanCardWithDetailProps {
  item: Work & { teamName?: string | null };
  currentUserId?: string;
  currentUserName?: string;
  systemRole?: "user" | "super_admin";
  availableUsers?: AvailableUser[];
}

export function KanbanCardWithDetail({
  item,
  currentUserId,
  systemRole: propSystemRole,
  availableUsers: propAvailableUsers,
}: KanbanCardWithDetailProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workDetail, setWorkDetail] = useState<WorkDetail>(
    item as unknown as WorkDetail,
  );
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(null);
  const [systemRole, setSystemRole] = useState<SystemRole | null>(propSystemRole ?? null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>(propAvailableUsers ?? []);

  const handleOpen = async () => {
    setOpen(true);
    try {
      const [fullWork, role] = await Promise.all([
        getWork(item.id),
        getMyRoleInAnyTeam(),
      ]);
      setWorkDetail(fullWork);
      setCurrentUserRole(role);

      // Fetch system role if we have currentUserId
      if (currentUserId && !propSystemRole) {
        const sysRole = await getSystemRole(currentUserId);
        setSystemRole(sysRole);
      }

      // Fetch team members if work has a team
      if (item.teamId) {
        const members = await getTeamMembers(item.teamId);
        setAvailableUsers(
          members.map((m) => ({
            id: m.user.id,
            name: m.user.name ?? m.user.email ?? "Unknown",
            email: m.user.email ?? "",
            image: m.user.image,
            role: m.role,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch work details:", error);
    }
  };

  const handleMoveToStage = async (newStage: string) => {
    try {
      await updateStage(item.id, newStage);
      toast.success(`Moved to ${stageLabels[newStage]}`);
      router.refresh();
    } catch {
      toast.error("Failed to move card");
    }
  };

  const handleStartWork = async (workId: string) => {
    try {
      const nextStage = item.stage === "new" ? "triaged" : "in_progress";
      await updateStage(workId, nextStage);
      toast.success(nextStage === "triaged" ? "Work triaged" : "Work started");
      router.refresh();
    } catch {
      toast.error("Failed to update stage");
    }
  };

  const handleApprove = async (workId: string) => {
    try {
      await approveWork(workId);
      toast.success("Work approved ✓");
      router.refresh();
    } catch {
      toast.error("Failed to approve work");
    }
  };

  const handleReject = async (workId: string, feedback: string) => {
    try {
      await rejectWork(workId, feedback);
      toast.success("Revision requested");
      router.refresh();
    } catch {
      toast.error("Failed to request revision");
    }
  };

  const handleBlock = async (workId: string, reason: string) => {
    try {
      await blockWork(workId, reason);
      toast.warning("Work marked as blocked");
      router.refresh();
    } catch {
      toast.error("Failed to block work");
    }
  };

  const handleAddComment = async (workId: string, content: string) => {
    try {
      await addComment({ workId, content });
      const fullWork = await getWork(item.id);
      setWorkDetail(fullWork);
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleAutoAssign = async (workId: string) => {
    try {
      if (!item.teamId) {
        toast.error("Work has no team");
        return;
      }
      const workloads = await getTeamMemberWorkloads(item.teamId);
      if (!workloads.length) {
        toast.error("No team members found");
        return;
      }
      const lightest = workloads.reduce((a, b) =>
        a.active <= b.active ? a : b,
      );
      await assignWork(workId, lightest.userId);
      toast.success(`Auto-assigned to ${lightest.name}`);
      router.refresh();
    } catch {
      toast.error("Auto-assign failed");
    }
  };

  // Filter out "triaged" transition for unassigned work
  const isUnassigned = !item.assignedTo;
  const availableTransitions = (stageTransitions[item.stage] || []).filter(
    (stage) => !(stage === "triaged" && isUnassigned),
  );

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <KanbanCard
            item={item}
            onClick={handleOpen}
            teamName={item.teamName}
            currentUserId={currentUserId}
          />
        </ContextMenuTrigger>
        <ContextMenuContent alignOffset={-4}>
          {availableTransitions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Move to
              </div>
              {availableTransitions.map((stage) => (
                <ContextMenuItem
                  key={stage}
                  onClick={() => handleMoveToStage(stage)}
                  className="gap-2"
                >
                  <ArrowRightIcon className="size-3.5" />
                  {stageLabels[stage]}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
            </>
          )}
          {item.stage === "awaiting_review" && (
            <>
              <ContextMenuItem
                onClick={() => handleApprove(item.id)}
                className="gap-2"
              >
                <CheckCircleIcon className="size-3.5 text-emerald-500" />
                Approve
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleReject(item.id, "")}
                className="gap-2"
              >
                <XCircleIcon className="size-3.5 text-amber-500" />
                Request Revision
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          {item.stage !== "blocked" && (
            <ContextMenuItem
              onClick={() => handleBlock(item.id, "Needs attention")}
              className="gap-2"
            >
              <AlertTriangleIcon className="size-3.5 text-red-500" />
              Block
            </ContextMenuItem>
          )}
          {item.stage === "blocked" && (
            <ContextMenuItem
              onClick={() => handleMoveToStage("in_progress")}
              className="gap-2"
            >
              <ArrowRightIcon className="size-3.5" />
              Unblock
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleOpen} className="gap-2">
            <MessageSquareIcon className="size-3.5" />
            View Details
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleAutoAssign(item.id)}
            className="gap-2"
          >
            <UserPlusIcon className="size-3.5" />
            Auto-assign
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <WorkDetailSheet
        work={workDetail as Parameters<typeof WorkDetailSheet>[0]["work"]}
        open={open}
        onOpenChange={setOpen}
        onStartWork={handleStartWork}
        onApprove={handleApprove}
        onReject={handleReject}
        onBlock={handleBlock}
        onAddComment={handleAddComment}
        onAutoAssign={handleAutoAssign}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
        systemRole={systemRole ?? undefined}
        availableUsers={availableUsers}
      />
    </>
  );
}
