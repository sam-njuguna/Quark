import { db } from "@/db";
import { work } from "@/db/schema/work";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  LockIcon,
  AlertTriangleIcon,
} from "lucide-react";
import Link from "next/link";

const stageColors: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-700",
  triaged: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  awaiting_review: "bg-purple-100 text-purple-700",
  revision: "bg-orange-100 text-orange-700",
  blocked: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
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

const typeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700",
  meeting: "bg-purple-100 text-purple-700",
  research: "bg-amber-100 text-amber-700",
  code: "bg-emerald-100 text-emerald-700",
  document: "bg-sky-100 text-sky-700",
  communication: "bg-rose-100 text-rose-700",
};

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function ShareWorkPage({ params }: SharePageProps) {
  const { id } = await params;

  const [item] = await db.select().from(work).where(eq(work.id, id)).limit(1);

  if (!item) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Quark
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3" />
            Public view · read-only
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Title & badges */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={typeColors[item.type] ?? ""}>{item.type}</Badge>
            <Badge className={stageColors[item.stage] ?? ""}>
              {stageLabels[item.stage] ?? item.stage}
            </Badge>
            {item.priority && (
              <span className="text-xs text-muted-foreground">
                Priority {item.priority}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              Created {format(new Date(item.createdAt), "MMM d, yyyy")}
            </span>
            {item.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                Due {format(new Date(item.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Description */}
        {item.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success Criteria */}
        {item.successCriteria && item.successCriteria.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {item.successCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Blocked reason */}
        {item.stage === "blocked" && item.blockedReason && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangleIcon className="size-4" />
                Blocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.blockedReason}</p>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileTextIcon className="size-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            {item.submittedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{format(new Date(item.submittedAt), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
            {item.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{format(new Date(item.completedAt), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline underline-offset-2">
            Quark
          </Link>{" "}
          · Multi-agent task orchestration
        </p>
      </div>
    </div>
  );
}
