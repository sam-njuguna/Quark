import {
  getSession,
  isPrivilegedUser,
  getSystemRole,
} from "@/actions/auth/session";
import { redirect } from "next/navigation";
import { getOrgTree, listAllTeamsFlat } from "@/actions/team/hierarchy";
import { OrgChartFlow } from "@/components/team/org-chart-flow";
import { TeamConnectorPanel } from "@/components/team/team-connector-panel";
import { Button } from "@/components/ui/button";
import { CirclePlus, UsersIcon } from "lucide-react";
import Link from "next/link";

interface TeamNodeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  children: TeamNodeData[];
}

export default async function HierarchyPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [privileged, systemRole] = await Promise.all([
    isPrivilegedUser(session.user.id),
    getSystemRole(session.user.id),
  ]);
  const isSuperAdmin = systemRole === "super_admin";

  const [orgTree, flatTeams] = await Promise.all([
    getOrgTree().catch(() => [] as TeamNodeData[]),
    privileged ? listAllTeamsFlat().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Org Chart</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualise your team structure and reporting lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          {privileged && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings?tab=teams">
                <UsersIcon className="size-3.5" />
                Manage
              </Link>
            </Button>
          )}
          {privileged && (
            <Button size="sm" asChild>
              <Link href="/dashboard/settings?tab=teams">
                <CirclePlus className="size-3.5 " />
                Add Team
              </Link>
            </Button>
          )}
        </div>
      </div>

      {privileged && flatTeams.length > 0 && (
        <TeamConnectorPanel teams={flatTeams} />
      )}

      {(orgTree as TeamNodeData[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <UsersIcon className="size-8 text-muted-foreground mb-4" />
          <h3 className="text-base font-semibold">No teams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Create your first team to see the organization hierarchy.
          </p>
          {privileged && (
            <Button className="mt-4" asChild>
              <Link href="/dashboard/settings?tab=teams">
                <CirclePlus className=" size-4" />
                Create Team
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <OrgChartFlow
          teams={orgTree as TeamNodeData[]}
          rootOrgName={isSuperAdmin ? "Company" : undefined}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border/40 pt-4">
        {[
          "Drag to pan",
          "Scroll to zoom",
          "Click a node to select",
          ...(privileged ? ["Use connector panel to set parent teams"] : []),
        ].map((tip) => (
          <span key={tip} className="text-[10px] text-muted-foreground/50">
            {tip}
          </span>
        ))}
      </div>
    </div>
  );
}
