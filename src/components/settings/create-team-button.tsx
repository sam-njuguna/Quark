"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { TeamCreationWizard } from "@/components/settings/team-creation-wizard";

export function CreateTeamButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-max"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <CirclePlus className="mr-1.5 size-3.5" />
        Create New Team
      </Button>
      <TeamCreationWizard open={open} onOpenChange={setOpen} />
    </>
  );
}
