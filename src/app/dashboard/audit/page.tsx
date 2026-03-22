import { db } from "@/db";
import { activity } from "@/db/schema/activity";
import { work } from "@/db/schema/work";
import { user as userTable } from "@/db/schema/auth-schema";
import { getSession, isPrivilegedUser } from "@/actions/auth/session";
import { redirect } from "next/navigation";
import { eq, desc, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { AuditFilters } from "@/components/activity/audit-filters";
import { Suspense } from "react";

const actionColors: Record<string, string> = {
  created: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  stage_changed:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  commented:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  submitted:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  assigned: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

interface AuditTrailPageProps {
  searchParams: Promise<{ search?: string; action?: string }>;
}

export default async function AuditTrailPage({
  searchParams,
}: AuditTrailPageProps) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const privileged = await isPrivilegedUser(session.user.id);
  if (!privileged) redirect("/dashboard");

  const params = await searchParams;
  const searchQuery = params.search ?? "";
  const actionFilter = params.action ?? "";

  const conditions = [];
  if (actionFilter && actionFilter !== "all") {
    conditions.push(eq(activity.action, actionFilter));
  }

  const events = await db
    .select({
      id: activity.id,
      action: activity.action,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      workId: activity.workId,
      workTitle: work.title,
      workType: work.type,
      userId: activity.userId,
      userName: userTable.name,
      userImage: userTable.image,
    })
    .from(activity)
    .innerJoin(work, eq(work.id, activity.workId))
    .innerJoin(userTable, eq(userTable.id, activity.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activity.createdAt))
    .limit(500);

  const filtered = searchQuery
    ? events.filter(
        (e) =>
          e.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.workTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : events;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Trail</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete history of all changes across your workspace
        </p>
      </div>

      <Suspense>
        <AuditFilters />
      </Suspense>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
            <ClockIcon className="size-3.5" />
            Activity Log
          </span>
          <span className="text-xs text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            {searchQuery || actionFilter ? " matching" : ""}
          </span>
        </div>
        <div className="pt-0">
          <ScrollArea className="h-[70vh]">
            <div className="pr-4">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 border-l border-border/40 ml-3 pl-4 py-2.5 hover:border-primary/40 transition-colors relative before:absolute before:left-[-4px] before:top-3 before:size-2 before:rounded-full before:bg-border/60 before:border-2 before:border-background"
                >
                  <Avatar className="mt-0.5 size-6 shrink-0">
                    <AvatarImage src={e.userImage ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {e.userName?.slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {e.userName ?? "Unknown"}
                      </span>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 font-medium ${actionColors[e.action] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {e.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground/80 truncate">
                        {e.workTitle}
                      </span>
                    </div>
                    {e.metadata &&
                      typeof e.metadata === "object" &&
                      "from" in e.metadata && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {String(e.metadata.from)} → {String(e.metadata.to)}
                        </p>
                      )}
                  </div>
                  <time className="text-[11px] text-muted-foreground shrink-0">
                    {format(new Date(e.createdAt), "MMM d, HH:mm")}
                  </time>
                </div>
              ))}
              {events.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
