"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTeam } from "@/actions/team/members";
import { toast } from "sonner";
import { Loader2Icon, UsersIcon, ShieldIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (teamId: string) => void;
}

const STEPS = [
  { id: 1, title: "Basic Info", description: "Team name and description" },
  { id: 2, title: "Privacy", description: "Team visibility settings" },
  { id: 3, title: "Invite", description: "Add team members" },
];

export function TeamCreationWizard({
  open,
  onOpenChange,
  onSuccess,
}: TeamCreationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private",
    memberEmails: [] as string[],
  });
  const [newEmail, setNewEmail] = useState("");

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && !formData.memberEmails.includes(email)) {
      setFormData({ ...formData, memberEmails: [...formData.memberEmails, email] });
      setNewEmail("");
    }
  };

  const removeEmail = (email: string) => {
    setFormData({
      ...formData,
      memberEmails: formData.memberEmails.filter((e) => e !== email),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsPending(true);
    try {
      const teamId = await createTeam(formData.name, formData.description);
      toast.success("Team created successfully!");
      onOpenChange(false);
      resetForm();
      onSuccess?.(teamId);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setIsPending(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: "",
      description: "",
      visibility: "private",
      memberEmails: [],
    });
    setNewEmail("");
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Set up your team in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  step >= s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {step > s.id ? <CheckIcon className="size-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 transition-colors",
                    step > s.id ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name *</Label>
                <Input
                  id="team-name"
                  placeholder="e.g., Engineering, Design, Marketing"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-desc">Description (optional)</Label>
                <Textarea
                  id="team-desc"
                  placeholder="What does this team do?"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team Visibility</Label>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, visibility: "private" })
                    }
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                      formData.visibility === "private"
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <ShieldIcon
                      className={cn(
                        "mt-0.5 size-5",
                        formData.visibility === "private"
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-sm text-muted-foreground">
                        Only invited members can view and join
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, visibility: "public" })
                    }
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                      formData.visibility === "public"
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <UsersIcon
                      className={cn(
                        "mt-0.5 size-5",
                        formData.visibility === "public"
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-sm text-muted-foreground">
                        Anyone in the organization can request to join
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Members (optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add email addresses of people you want to invite. They must
                  already have a Quark account.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addEmail}>
                    Add
                  </Button>
                </div>
                {formData.memberEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.memberEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                Create Team
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
