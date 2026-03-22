"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  Layers,
  ChevronDownIcon,
  NetworkIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "My Work", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users },
  { href: "/all", label: "All Work", icon: Layers },
  { href: "/board", label: "Board", icon: FolderKanban },
  { href: "/hierarchy", label: "Hierarchy", icon: NetworkIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface TeamInfo {
  id: string;
  name: string;
}

interface SidebarProps {
  teams?: TeamInfo[];
}

export function Sidebar({ teams = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTeamId = searchParams.get("team");

  const activeTeam = teams.find((t) => t.id === currentTeamId) ?? teams[0];

  const switchTeam = useCallback(
    (teamId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("team", teamId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b px-3 py-3">
        {teams.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 font-normal"
              >
                <div className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeTeam?.name?.charAt(0) ?? "?"}
                </div>
                <span className="flex-1 truncate text-left text-sm">
                  {activeTeam?.name ?? "Select Team"}
                </span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem className="text-xs font-medium text-muted-foreground">
                Switch Team
              </DropdownMenuItem>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => switchTeam(team.id)}
                  className={cn(
                    "gap-2 cursor-pointer",
                    team.id === activeTeam?.id && "bg-muted",
                  )}
                >
                  <div className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                    {team.name.charAt(0)}
                  </div>
                  {team.name}
                  {team.id === activeTeam?.id && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Active
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : activeTeam ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5">
            <div className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              {activeTeam.name.charAt(0)}
            </div>
            <span className="flex-1 truncate text-sm font-medium">
              {activeTeam.name}
            </span>
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                "justify-start gap-2",
                pathname === item.href &&
                  "bg-zinc-100 font-medium dark:bg-zinc-800",
              )}
            >
              <Link
                href={
                  activeTeam
                    ? `${item.href}?team=${activeTeam.id}`
                    : item.href
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
