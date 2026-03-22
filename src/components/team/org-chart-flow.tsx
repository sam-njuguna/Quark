"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  Handle,
  Position,
  BackgroundVariant,
  EdgeProps,
  BaseEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UsersIcon,
  MoreVerticalIcon,
  CirclePlus,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberNodeData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  reportsTo?: string;
}

interface TeamNodeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  role?: string;
  members?: MemberNodeData[];
  children: TeamNodeData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
}

function MemberAvatar({
  member,
  size = "sm",
}: {
  member: MemberNodeData;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-6" : "size-8";
  const fontSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="group relative">
      <Avatar className={cn(sizeClass, "ring-2 ring-background")}>
        <AvatarImage src={member.image} alt={member.name} />
        <AvatarFallback className={fontSize}>
          {member.name?.slice(0, 2).toUpperCase() || "??"}
        </AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 z-10">
        <Badge
          variant="outline"
          className={cn(
            "h-4 min-w-[16px] px-1 text-[8px]",
            member.role === "lead" &&
              "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300",
            member.role === "admin" &&
              "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300",
          )}
        >
          {member.role === "lead" ? "L" : member.role === "admin" ? "A" : "M"}
        </Badge>
      </div>
    </div>
  );
}

function TeamFlowNode({ data }: { data: TeamNodeData }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const displayMembers = data.members?.slice(0, 5) || [];
  const remainingCount = (data.members?.length || 0) - 5;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="bg-primary w-2 h-2"
      />
      <Card
        className={cn(
          "w-[260px] transition-all duration-200",
          isHovered && "ring-2 ring-primary shadow-lg",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm truncate">{data.name}</CardTitle>
                {data.role && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5",
                      data.role === "admin" &&
                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                      data.role === "lead" &&
                        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                    )}
                  >
                    {data.role}
                  </Badge>
                )}
              </div>
              {data.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {data.description}
                </p>
              )}
            </div>
            {(data.onEdit || data.onDelete || data.onAddChild) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="sm" className="size-6 p-0">
                    <MoreVerticalIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {data.onAddChild && (
                    <DropdownMenuItem
                      onClick={() => data.onAddChild?.(data.id)}
                      className="text-xs"
                    >
                      <CirclePlus className="size-3 mr-2" />
                      Add sub-team
                    </DropdownMenuItem>
                  )}
                  {data.onEdit && (
                    <DropdownMenuItem
                      onClick={() => data.onEdit?.(data.id)}
                      className="text-xs"
                    >
                      <EditIcon className="size-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {data.onDelete && (
                    <DropdownMenuItem
                      onClick={() => data.onDelete?.(data.id)}
                      className="text-xs text-destructive"
                    >
                      <TrashIcon className="size-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {data.members && data.members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UsersIcon className="size-3" />
                  Team Members
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-[10px]"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Hide" : `+${data.members.length}`}
                </Button>
              </div>
              {isExpanded && (
                <div className="flex flex-wrap gap-1">
                  {displayMembers.map((member) => (
                    <MemberAvatar key={member.id} member={member} size="sm" />
                  ))}
                  {remainingCount > 0 && (
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              <UsersIcon className="size-3 mr-1" />
              {data.memberCount} member{data.memberCount !== 1 ? "s" : ""}
            </Badge>
            {data.children.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {data.children.length} sub-team
                {data.children.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-primary w-2 h-2"
      />
    </>
  );
}

// Custom step edge with a colored dot at the midpoint (matches design)
function StepDotEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {
  // Step path: go down from source, then across, then down to target
  const midY = sourceY + (targetY - sourceY) / 2;
  const path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  const dotX = sourceX;
  const dotY = midY;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <circle
        cx={dotX}
        cy={dotY}
        r={6}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

const nodeTypes: NodeTypes = {
  team: TeamFlowNode,
};

const edgeTypes: EdgeTypes = {
  stepDot: StepDotEdge,
};

interface OrgChartFlowProps {
  teams: TeamNodeData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string;
  rootOrgName?: string;
}

export function OrgChartFlow({
  teams,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
  selectedId,
  rootOrgName,
}: OrgChartFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const horizontalGap = 280;
    const verticalGap = 150;

    const processLevel = (
      teamList: TeamNodeData[],
      level: number,
      startX: number,
      parentId: string | null = null,
    ): number => {
      const levelWidth = teamList.length * horizontalGap;
      let currentX = startX - levelWidth / 2 + horizontalGap / 2;

      for (const team of teamList) {
        const nodeId = team.id;
        const y = level * verticalGap;

        newNodes.push({
          id: nodeId,
          type: "team",
          position: { x: currentX, y },
          data: {
            ...team,
            onEdit,
            onDelete,
            onAddChild,
          },
          selected: nodeId === selectedId,
        });

        if (parentId) {
          newEdges.push({
            id: `${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: "stepDot",
            style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
            markerEnd: {
              type: "arrowclosed" as const,
              color: "hsl(var(--muted-foreground))",
            },
          });
        }

        if (team.children && team.children.length > 0) {
          const childCount = countNodes(team.children);
          const childWidth = childCount * horizontalGap;
          const childStartX = currentX - childWidth / 2 + horizontalGap / 2;

          processLevel(team.children, level + 1, childStartX, nodeId);
        }

        currentX += horizontalGap;
      }

      return levelWidth;
    };

    const countNodes = (teamList: TeamNodeData[]): number => {
      let count = teamList.length;
      for (const team of teamList) {
        if (team.children) {
          count += countNodes(team.children);
        }
      }
      return count;
    };

    const totalWidth = Math.max(countNodes(teams) * horizontalGap, 800);
    processLevel(teams, rootOrgName ? 1 : 0, totalWidth / 2);

    if (rootOrgName) {
      const ROOT_ID = "__org_root__";
      newNodes.unshift({
        id: ROOT_ID,
        type: "team",
        position: { x: totalWidth / 2, y: 0 },
        data: {
          id: ROOT_ID,
          name: rootOrgName,
          slug: "org-root",
          description: "Company root — managed by Super Admin",
          memberCount: teams.length,
          children: [],
        },
        selected: false,
      });
      for (const rootTeam of teams) {
        newEdges.push({
          id: `${ROOT_ID}-${rootTeam.id}`,
          source: ROOT_ID,
          target: rootTeam.id,
          type: "stepDot",
          style: {
            stroke: "hsl(var(--primary))",
            strokeWidth: 1.5,
            strokeDasharray: "4 2",
          },
          markerEnd: {
            type: "arrowclosed" as const,
            color: "hsl(var(--primary))",
          },
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    teams,
    onEdit,
    onDelete,
    onAddChild,
    selectedId,
    rootOrgName,
    setNodes,
    setEdges,
  ]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelect?.(node.id);
    },
    [onSelect],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center">
        <UsersIcon className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No teams yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Create teams to build your organization hierarchy
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border  overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls className="bg-background border rounded-lg shadow-md" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
