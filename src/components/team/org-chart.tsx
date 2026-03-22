"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, ChevronRightIcon, UsersIcon, MoreVerticalIcon } from "lucide-react";

interface TeamNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  memberCount: number;
  children: TeamNode[];
}

interface OrgChartProps {
  teams: TeamNode[];
  onSelectTeam?: (teamId: string) => void;
  selectedTeamId?: string;
}

function TeamCard({
  node,
  level,
  onSelect,
  isSelected,
  onMove,
  availableParents,
}: {
  node: TeamNode;
  level: number;
  onSelect?: (teamId: string) => void;
  isSelected?: boolean;
  onMove?: (teamId: string, parentId: string | null) => void;
  availableParents?: TeamNode[];
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  return (
    <div className="space-y-2">
      <Card
        className={`transition-colors ${
          isSelected ? "border-primary ring-1 ring-primary" : ""
        }`}
      >
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </Button>
            )}
            {node.children.length === 0 && <div className="w-6" />}

            <div
              className="flex-1 cursor-pointer"
              onClick={() => onSelect?.(node.id)}
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{node.name}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {node.memberCount} members
                </Badge>
              </div>
              {node.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {node.description}
                </p>
              )}
            </div>

            {onMove && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="size-6 p-0">
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onMove(node.id, null)}
                    className="text-xs"
                  >
                    Make root team
                  </DropdownMenuItem>
                  {availableParents
                    ?.filter((t) => t.id !== node.id)
                    .map((parent) => (
                      <DropdownMenuItem
                        key={parent.id}
                        onClick={() => onMove(node.id, parent.id)}
                        className="text-xs"
                      >
                        Move to {parent.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
      </Card>

      {isExpanded && node.children.length > 0 && (
        <div
          className="ml-6 pl-4 border-l border-border"
          style={{ borderLeftWidth: "2px" }}
        >
          {node.children.map((child) => (
            <TeamCard
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              isSelected={isSelected}
              onMove={onMove}
              availableParents={availableParents}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChart({ teams, onSelectTeam, selectedTeamId }: OrgChartProps) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UsersIcon className="size-8 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium">No teams yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Create teams to build your org chart
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teams.map((root) => (
        <TeamCard
          key={root.id}
          node={root}
          level={0}
          onSelect={onSelectTeam}
          isSelected={selectedTeamId === root.id}
          availableParents={teams}
        />
      ))}
    </div>
  );
}
