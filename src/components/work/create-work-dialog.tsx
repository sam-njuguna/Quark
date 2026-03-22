"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateWorkForm } from "./create-work-form";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { toast } from "sonner";

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  teamId: string;
}

interface AvailableTeam {
  id: string;
  name: string;
}

interface CreateWorkDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  teamId?: string;
  stage?: string;
  availableUsers?: AvailableUser[];
  availableTeams?: AvailableTeam[];
  onSuccess?: () => void;
}

export function CreateWorkDialog({
  open = false,
  onOpenChange,
  teamId,
  availableUsers = [],
  availableTeams = [],
  onSuccess,
}: CreateWorkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Work</DialogTitle>
        </DialogHeader>
        <CreateWorkForm
          teamId={teamId}
          availableUsers={availableUsers}
          availableTeams={availableTeams}
          onSuccess={() => {
            handleOpenChange(false);
            onSuccess?.();
            toast.success("Work item created");
          }}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface QuickCreateButtonProps {
  teamId?: string;
  stage?: string;
  availableUsers?: AvailableUser[];
  availableTeams?: AvailableTeam[];
  onSuccess?: () => void;
}

export function QuickCreateButton({
  teamId,
  stage,
  availableUsers = [],
  availableTeams = [],
  onSuccess,
}: QuickCreateButtonProps) {
  const [open, setOpen] = useState(false);

  const handleQuickCreate = () => {
    if (!teamId) {
      toast.error("Please select a team first");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="size-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleQuickCreate}
        title="Create work in this stage"
      >
        <CirclePlus className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New Work
              {stage && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (for {stage.replace(/_/g, " ")} stage)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <CreateWorkForm
            teamId={teamId}
            availableUsers={availableUsers}
            availableTeams={availableTeams}
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
              toast.success("Work item created");
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
