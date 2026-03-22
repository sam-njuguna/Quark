"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InboxIcon,
  LayoutGridIcon,
  Users,
  Settings2,
  BellIcon,
  LogOutIcon,
  CirclePlus,
  ZapIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlugIcon,
  TrendingUpIcon,
  NetworkIcon,
  MoonIcon,
  CalendarIcon,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamCreationWizard } from "@/components/settings/team-creation-wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { setActiveTeam } from "@/actions/team/active-team";
import type { SystemRole } from "@/actions/auth/session";

interface Team {
  id: string;
  name: string;
  logo?: React.ReactNode;
  plan?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface NavCounts {
  awaitingReview: number;
  blocked: number;
  myWorkCount: number;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User;
  teams?: Team[];
  currentTeam?: Team;
  navCounts?: NavCounts;
  currentUserRole?: "member" | "lead" | "admin" | null;
  systemRole?: SystemRole;
  isPrivileged?: boolean;
}

const MEMBER_NAV: NavItem[] = [
  {
    title: "My Work",
    url: "/dashboard",
    icon: <InboxIcon className="size-4" />,
  },
  {
    title: "All Work",
    url: "/dashboard/all",
    icon: <LayoutGridIcon className="size-4" />,
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: <Users className="size-4" />,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: <CalendarIcon className="size-4" />,
  },
];

const PRIVILEGED_NAV: NavItem[] = [
  {
    title: "My Work",
    url: "/dashboard",
    icon: <InboxIcon className="size-4" />,
  },
  {
    title: "All Work",
    url: "/dashboard/all",
    icon: <LayoutGridIcon className="size-4" />,
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: <Users className="size-4" />,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: <CalendarIcon className="size-4" />,
  },
  {
    title: "Hierarchy",
    url: "/dashboard/hierarchy",
    icon: <NetworkIcon className="size-4" />,
  },
];

const UTILITY_NAV: NavItem[] = [
  {
    title: "New Work",
    url: "/dashboard/new",
    icon: <CirclePlus className="size-4" />,
  },
  {
    title: "My Analytics",
    url: "/dashboard/analytics",
    icon: <TrendingUpIcon className="size-4" />,
  },
  {
    title: "Integrations",
    url: "/dashboard/integrations",
    icon: <PlugIcon className="size-4" />,
  },
  {
    title: "Audit Trail",
    url: "/dashboard/audit",
    icon: <ClockIcon className="size-4" />,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: <Settings2 className="size-4" />,
  },
];

function QuarkTeamSwitcher({
  teams,
  currentTeam,
  isPrivileged,
}: {
  teams?: Team[];
  currentTeam?: Team;
  isPrivileged?: boolean;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);

  const activeTeam = currentTeam || teams?.[0];

  const switchTeam = async (teamId: string) => {
    await setActiveTeam(teamId);
    router.refresh();
  };

  const handleWizardSuccess = async (teamId: string) => {
    await setActiveTeam(teamId);
    router.refresh();
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm tracking-tight select-none"
                  style={{
                    fontFamily: "var(--font-display, var(--font-sans))",
                  }}
                >
                  Q
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeTeam?.name || "Quark"}
                  </span>
                  <span className="truncate text-xs">
                    {activeTeam?.plan || "Team"}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Teams
              </DropdownMenuLabel>
              {isPrivileged && (
                <DropdownMenuItem asChild className="gap-2 p-2 cursor-pointer">
                  <a href="/dashboard/all">
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <LayoutGridIcon className="size-4" />
                    </div>
                    All Teams
                  </a>
                </DropdownMenuItem>
              )}
              {teams?.map((team, index) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => switchTeam(team.id)}
                  className={cn(
                    "gap-2 p-2 cursor-pointer",
                    team.id === activeTeam?.id && "bg-sidebar-accent",
                  )}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    {team.logo || <ZapIcon className="size-4" />}
                  </div>
                  {team.name}
                  {team.id === activeTeam?.id && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Active
                    </span>
                  )}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowWizard(true)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <CirclePlus className="size-4" />
                </div>
                <div className="font-medium">Create team</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <TeamCreationWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={handleWizardSuccess}
      />
    </>
  );
}

function NavGroup({
  label,
  items,
  navCounts,
}: {
  label?: string;
  items: NavItem[];
  navCounts?: NavCounts;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 py-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.url === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.url);

          const badge =
            item.url === "/dashboard" && navCounts
              ? navCounts.myWorkCount > 0
                ? navCounts.myWorkCount
                : null
              : null;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={cn(
                  "relative transition-colors",
                  isActive && [
                    "bg-transparent! text-foreground font-medium",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                    "before:h-4 before:w-0.5 before:rounded-full before:bg-primary",
                  ],
                  !isActive &&
                    "text-muted-foreground hover:text-foreground hover:bg-transparent!",
                )}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                  {badge !== null && (
                    <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function QuarkUser({ user }: { user?: User }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-7 w-7 rounded-md">
                <AvatarImage src={user?.image} alt={user?.name} />
                <AvatarFallback className="rounded-md text-xs font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-sm">
                  {user?.name || "User"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-3.5 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.name || "User"}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings2 className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellIcon className="size-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <div className="flex items-center gap-2 px-2 py-1.5 w-full">
                <MoonIcon className="size-4" />
                <span className="flex-1">Theme</span>
                <ThemeToggle />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const response = await fetch("/api/auth/sign-out", {
                    method: "POST",
                  });
                  if (response.ok) {
                    router.push("/login");
                  }
                } catch (error) {
                  console.error("Sign out failed:", error);
                }
              }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({
  user,
  teams,
  currentTeam,
  navCounts,
  currentUserRole,
  systemRole,
  isPrivileged = false,
  ...props
}: AppSidebarProps) {
  // systemRole is destructured to prevent it from being passed to DOM via ...props
  const canAdmin = currentUserRole === "lead" || currentUserRole === "admin";
  const mainNav = isPrivileged ? PRIVILEGED_NAV : MEMBER_NAV;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <QuarkTeamSwitcher
          teams={isPrivileged ? teams : undefined}
          currentTeam={currentTeam}
          isPrivileged={isPrivileged}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={mainNav} navCounts={navCounts} />
        {canAdmin && (
          <NavGroup
            label="Admin"
            items={[
              {
                title: "Admin Dashboard",
                url: "/dashboard/admin",
                icon: <ShieldCheckIcon className="size-4" />,
              },
            ]}
          />
        )}
        <NavGroup
          label="Tools"
          items={
            isPrivileged
              ? UTILITY_NAV
              : UTILITY_NAV.filter((i) => i.url !== "/dashboard/audit")
          }
        />
      </SidebarContent>
      <SidebarFooter>
        <QuarkUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
