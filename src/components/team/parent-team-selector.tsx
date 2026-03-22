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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateTeamParent } from "@/actions/team/hierarchy";
import { NetworkIcon } from "lucide-react";

interface Team {
  id: string;
  name: string;
  parentId?: string | null;
}

interface ParentTeamSelectorProps {
  currentTeam: Team;
  allTeams: Team[];
}

export function ParentTeamSelector({ currentTeam, allTeams }: ParentTeamSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedParent, setSelectedParent] = useState<string>(
    currentTeam.parentId ?? "none",
  );

  const eligibleParents = allTeams.filter((t) => t.id !== currentTeam.id);

  const handleSave = () => {
    const newParentId = selectedParent === "none" ? null : selectedParent;
    startTransition(async () => {
      try {
        await updateTeamParent(currentTeam.id, newParentId);
        toast.success("Team hierarchy updated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update hierarchy");
      }
    });
  };

  const currentParentName = eligibleParents.find(
    (t) => t.id === currentTeam.parentId,
  )?.name;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <NetworkIcon className="size-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Parent Team</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Set a parent team to create an org-chart hierarchy. Currently:{" "}
        <span className="font-medium text-foreground">
          {currentParentName ?? "None (root team)"}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Select value={selectedParent} onValueChange={setSelectedParent}>
          <SelectTrigger className="flex-1 h-8 text-sm">
            <SelectValue placeholder="Select parent team…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (root team)</SelectItem>
            {eligibleParents.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || selectedParent === (currentTeam.parentId ?? "none")}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
