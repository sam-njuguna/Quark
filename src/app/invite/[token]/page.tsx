import { redirect } from "next/navigation";
import { getInvitationByToken, acceptInvitation } from "@/actions/team/members";
import { getSession } from "@/actions/auth/session";
import { AcceptInvitationForm } from "./accept-form";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

type Invitation = Awaited<ReturnType<typeof getInvitationByToken>>;

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const session = await getSession();

  if (!invitation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Q
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Quark
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Invalid Invitation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This invitation link is invalid or has expired.
          </p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-4 text-sm text-destructive">
          The invitation link you followed does not exist. Please ask your team
          administrator to send you a new invitation.
        </div>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Q
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Quark
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Invitation Already Used
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This invitation has already been accepted.
          </p>
        </div>
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            You can access the team by signing in and navigating to the{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              dashboard
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Q
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Quark
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Invitation Expired
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            This invitation has expired.
          </p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-4 text-sm text-destructive">
          The invitation link has expired. Please ask your team administrator to
          send you a new invitation.
        </div>
      </div>
    );
  }

  if (session?.user) {
    try {
      await acceptInvitation(token);
      redirect("/dashboard");
    } catch {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-sm select-none"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Q
            </div>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Quark
            </span>
          </div>
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Unable to Accept Invitation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              You may already be a member of this team.
            </p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              You can try accessing the{" "}
              <a href="/dashboard" className="text-primary hover:underline">
                dashboard
              </a>
              .
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <AcceptInvitationForm
      invitation={invitation as Invitation}
      inviteToken={token}
    />
  );
}
