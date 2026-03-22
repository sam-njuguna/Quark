"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkDetailSheet } from "@/components/work/work-detail-sheet";
import { updateStage } from "@/actions/work/update-stage";
import { approveWork } from "@/actions/work/approve";
import { rejectWork } from "@/actions/work/reject";
import { blockWork } from "@/actions/work/block";
import { addComment } from "@/actions/comments/add";
import { getWork } from "@/actions/work/get";
import { assignWork } from "@/actions/work/assign";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Work } from "@/db/schema/work";
import { format } from "date-fns";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  CalendarIcon,
  Trash2Icon,
  SquareArrowRightIcon,
  ChevronsUpDownIcon,
  EyeIcon,
} from "lucide-react";

const typeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  meeting:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  research:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  code: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  document: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  communication:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const stageColors: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  triaged: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  awaiting_review:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  revision:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

const stageLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  awaiting_review: "Review",
  revision: "Revision",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

const priorityIcons: Record<number, React.ReactNode> = {
  1: <ArrowUpIcon className="size-3.5 text-red-500" />,
  2: <ArrowRightIcon className="size-3.5 text-amber-500" />,
  3: <ArrowDownIcon className="size-3.5 text-zinc-400" />,
};

type SortField =
  | "title"
  | "type"
  | "stage"
  | "priority"
  | "dueDate"
  | "createdAt";
type SortDir = "asc" | "desc";

type WorkDetail = Awaited<ReturnType<typeof getWork>>;

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface WorkListTableProps {
  workItems: Work[];
  availableUsers?: AvailableUser[];
}

function SwitchAssigneeButton({
  workId,
  currentAssigneeId,
  users,
}: {
  workId: string;
  currentAssigneeId: string | null;
  users: AvailableUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current = users.find((u) => u.id === currentAssigneeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 gap-1 text-xs max-w-[100px]"
          disabled={pending}
        >
          {current ? (
            <>
              <Avatar className="size-4">
                <AvatarImage src={current.image ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {current.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{current.name.split(" ")[0]}</span>
            </>
          ) : (
            <span className="text-muted-foreground/60 text-[10px]">Assign</span>
          )}
          <ChevronsUpDownIcon className="size-2.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs">
          Switch assignee
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((u) => (
          <DropdownMenuItem
            key={u.id}
            className="gap-2 text-xs"
            onSelect={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await assignWork(workId, u.id);
                router.refresh();
              });
            }}
          >
            <Avatar className="size-5">
              <AvatarImage src={u.image ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {u.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{u.name}</span>
            {u.id === currentAssigneeId && (
              <span className="ml-auto text-[9px] text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WorkListTable({
  workItems,
  availableUsers,
}: WorkListTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [workDetail, setWorkDetail] = useState<WorkDetail | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...workItems].sort((a, b) => {
    let va: unknown = a[sortField];
    let vb: unknown = b[sortField];
    if (sortField === "dueDate" || sortField === "createdAt") {
      va = va ? new Date(va as string).getTime() : 0;
      vb = vb ? new Date(vb as string).getTime() : 0;
    }
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allChecked = selected.size === workItems.length && workItems.length > 0;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(workItems.map((w) => w.id)));
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleOpen = async (item: Work) => {
    setOpenId(item.id);
    setWorkDetail(item as unknown as WorkDetail);
    try {
      const full = await getWork(item.id);
      setWorkDetail(full);
    } catch {}
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortDir === "asc" ? (
      <ArrowUpIcon className="ml-1 inline size-3" />
    ) : (
      <ArrowDownIcon className="ml-1 inline size-3" />
    );
  };

  const th = (label: string, field: SortField) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <SortIcon field={field} />
    </button>
  );

  const openItem = workItems.find((w) => w.id === openId);

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
            <SquareArrowRightIcon className="size-3" />
            Move stage
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-3" />
            Cancel selected
          </Button>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{th("Title", "title")}</TableHead>
              <TableHead className="w-28">{th("Type", "type")}</TableHead>
              <TableHead className="w-36">{th("Stage", "stage")}</TableHead>
              <TableHead className="w-20">
                {th("Priority", "priority")}
              </TableHead>
              <TableHead className="w-32">{th("Due", "dueDate")}</TableHead>
              <TableHead className="w-32">
                {th("Created", "createdAt")}
              </TableHead>
              {availableUsers && availableUsers.length > 0 && (
                <TableHead className="w-40 text-xs font-medium text-muted-foreground">
                  Assignee
                </TableHead>
              )}
              {(!availableUsers || availableUsers.length === 0) && (
                <TableHead className="w-10" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell
                  className="pl-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={() => toggle(item.id)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  <Link
                    href={`/dashboard/work/${item.id}`}
                    className="hover:underline"
                  >
                    {item.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${typeColors[item.type]} border-0 capitalize text-xs`}
                  >
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${stageColors[item.stage]} border-0 text-xs`}
                  >
                    {stageLabels[item.stage]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    {priorityIcons[item.priority ?? 2]}
                    <span className="text-xs text-muted-foreground">
                      P{item.priority ?? 2}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.dueDate ? (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {format(new Date(item.dueDate), "MMM d")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(item.createdAt), "MMM d")}
                </TableCell>
                {availableUsers && availableUsers.length > 0 && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <SwitchAssigneeButton
                        workId={item.id}
                        currentAssigneeId={item.assignedTo ?? null}
                        users={availableUsers}
                      />
                      <button
                        onClick={() => handleOpen(item)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Quick view"
                      >
                        <EyeIcon className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                )}
                {(!availableUsers || availableUsers.length === 0) && (
                  <TableCell>
                    <button
                      onClick={() => handleOpen(item)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Quick view"
                    >
                      <EyeIcon className="size-3.5" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {openItem && workDetail && (
        <WorkDetailSheet
          work={workDetail as Parameters<typeof WorkDetailSheet>[0]["work"]}
          open={openId !== null}
          onOpenChange={(o) => {
            if (!o) setOpenId(null);
          }}
          onStartWork={async (id) => {
            const stage = openItem.stage === "new" ? "triaged" : "in_progress";
            await updateStage(id, stage);
            router.refresh();
          }}
          onApprove={async (id) => {
            await approveWork(id);
            router.refresh();
          }}
          onReject={async (id, feedback) => {
            await rejectWork(id, feedback);
            router.refresh();
          }}
          onBlock={async (id, reason) => {
            await blockWork(id, reason);
            router.refresh();
          }}
          onAddComment={async (id, content) => {
            await addComment({ workId: id, content });
            const full = await getWork(id);
            setWorkDetail(full);
          }}
        />
      )}
    </>
  );
}
