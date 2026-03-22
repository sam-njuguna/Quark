import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  getSession,
  getUserTeams,
  getSystemRole,
  isPrivilegedUser,
} from "@/actions/auth/session";
import { getActiveTeamId } from "@/actions/team/active-team";
import { getNavCounts } from "@/actions/work/analytics";
import { listMyActivity } from "@/actions/activity/list";
import { getMyRoleInAnyTeam } from "@/actions/team/role";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationCenter } from "@/components/layout/notification-center";
import { CommandPalette } from "@/components/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const [
    teams,
    navCounts,
    activities,
    currentUserRole,
    systemRole,
    privileged,
    activeTeamId,
  ] = await Promise.all([
    getUserTeams(user.id),
    getNavCounts(),
    listMyActivity(20),
    getMyRoleInAnyTeam(),
    getSystemRole(user.id),
    isPrivilegedUser(user.id),
    getActiveTeamId(user.id),
  ]);

  const unreadCount = navCounts.awaitingReview + navCounts.blocked;

  const sidebarProps = {
    user: {
      id: user.id,
      name: user.name || "User",
      email: user.email || "",
      image: user.image || undefined,
    },
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      plan: "Team",
    })),
    currentTeam: (() => {
      const active = teams.find((t) => t.id === activeTeamId) ?? teams[0];
      return active
        ? { id: active.id, name: active.name, plan: "Team" }
        : undefined;
    })(),
  };

  return (
    <SidebarProvider>
      <AppSidebar
        {...sidebarProps}
        navCounts={navCounts}
        currentUserRole={currentUserRole}
        systemRole={systemRole}
        isPrivileged={privileged}
      />
      <SidebarInset className="flex-1 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-sidebar/90 backdrop-blur-md sticky top-0 z-10 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger className="-ml-1 size-8 text-muted-foreground hover:text-foreground" />
            <Separator
              orientation="vertical"
              className="mr-1 data-[orientation=vertical]:h-4 opacity-30"
            />
            <DynamicBreadcrumb />
            <div className="ml-auto flex items-center gap-1">
              <GlobalSearch />
              <NotificationCenter
                initialActivities={activities}
                unreadCount={unreadCount}
              />
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 animate-fade-in">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
