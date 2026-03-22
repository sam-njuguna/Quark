"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NetworkIcon, LinkIcon, UnlinkIcon, Loader2 } from "lucide-react";
import { updateTeamParent } from "@/actions/team/hierarchy";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FlatTeam {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface TeamConnectorPanelProps {
  teams: FlatTeam[];
}

function TeamRow({ team, allTeams }: { team: FlatTeam; allTeams: FlatTeam[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedParent, setSelectedParent] = useState(team.parentId ?? "none");

  const eligibleParents = allTeams.filter(
    (t) => t.id !== team.id && t.parentId !== team.id,
  );
  const parentName = allTeams.find((t) => t.id === team.parentId)?.name;
  const isDirty = selectedParent !== (team.parentId ?? "none");

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateTeamParent(
          team.id,
          selectedParent === "none" ? null : selectedParent,
        );
        toast.success(`${team.name} parent updated`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 border  px-3 py-2.5 transition-colors",
        isDirty && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{team.name}</span>
          {parentName ? (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 gap-1 shrink-0"
            >
              <LinkIcon className="size-2.5" />
              {parentName}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 text-muted-foreground shrink-0"
            >
              root
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Select value={selectedParent} onValueChange={setSelectedParent}>
          <SelectTrigger className="h-7 w-[160px] text-xs">
            <SelectValue placeholder="Select parent…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="flex items-center gap-1.5 text-xs">
                <UnlinkIcon className="size-3 text-muted-foreground" />
                No parent (root)
              </span>
            </SelectItem>
            {eligibleParents.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="default"
          className=" "
          disabled={!isDirty || pending}
          onClick={handleSave}
        >
          {pending ? (
            <div className="animate-spin siz4 ">
              <Loader2 className="size-4" />
            </div>
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </div>
  );
}

export function TeamConnectorPanel({ teams }: TeamConnectorPanelProps) {
  if (teams.length === 0) return null;

  return (
    <div className="border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <NetworkIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Team Hierarchy Connector</h3>
        <Badge variant="secondary" className="text-[10px]">
          Admin only
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Set parent teams to define reporting lines. Changes reflect immediately
        on the org chart.
      </p>
      <ScrollArea className="max-h-[320px]">
        <div className="space-y-1.5 pr-2">
          {teams.map((t) => (
            <TeamRow key={t.id} team={t} allTeams={teams} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
