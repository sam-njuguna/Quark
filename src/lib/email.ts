import { Resend } from "resend";
import { render } from "@react-email/components";
import MagicLinkEmail from "@/emails/magic-link";
import TeamInviteEmail from "@/emails/team-invite";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "Quark <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export async function sendMagicLinkEmail(email: string, url: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email send");
    console.info(`Magic link for ${email}: ${url}`);
    return { id: "dev-mode" };
  }

  try {
    const emailHtml = await render(MagicLinkEmail({ url }), { pretty: false });

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Sign In to Quark",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send magic link email:", error);
      throw new Error("Failed to send magic link email");
    }

    return data;
  } catch (error) {
    console.error("Error sending magic link email:", error);
    throw error;
  }
}

export async function sendMentionNotificationEmail(params: {
  toEmail: string;
  toName: string;
  mentionedBy: string;
  workTitle: string;
  workId: string;
  commentContent: string;
}) {
  if (!resend) return;
  const workUrl = `${APP_URL}/dashboard/work/${params.workId}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `${params.mentionedBy} mentioned you in "${params.workTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="font-size:18px;font-weight:600;margin-bottom:8px">You were mentioned</h2>
          <p style="color:#6b7280;margin-bottom:16px">
            <strong>${params.mentionedBy}</strong> mentioned you in a comment on
            <strong>"${params.workTitle}"</strong>
          </p>
          <blockquote style="border-left:3px solid #e5e7eb;padding:8px 16px;color:#374151;margin:16px 0">
            ${params.commentContent}
          </blockquote>
          <a href="${workUrl}" style="display:inline-block;background:#09090b;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:14px">
            View Work Item
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send mention notification:", err);
  }
}

export async function sendDigestEmail(params: {
  toEmail: string;
  toName: string;
  items: Array<{ title: string; stage: string; id: string }>;
}) {
  if (!resend || params.items.length === 0) return;

  const itemsHtml = params.items
    .map(
      (item) =>
        `<li style="margin-bottom:8px"><a href="${APP_URL}/dashboard/work/${item.id}" style="color:#2563eb;text-decoration:none">${item.title}</a> <span style="color:#9ca3af;font-size:12px">[${item.stage.replace("_", " ")}]</span></li>`,
    )
    .join("");

  try {
    await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `Quark digest — ${params.items.length} item${params.items.length !== 1 ? "s" : ""} need your attention`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="font-size:18px;font-weight:600;margin-bottom:8px">Your Quark digest</h2>
          <p style="color:#6b7280;margin-bottom:16px">Hi ${params.toName}, here are your pending work items:</p>
          <ul style="padding-left:20px">${itemsHtml}</ul>
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#09090b;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:16px">
            Open Dashboard
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send digest email:", err);
  }
}

export async function sendTeamInviteEmail(params: {
  toEmail: string;
  teamName: string;
  invitedByName: string;
  role: "member" | "lead" | "admin";
  inviteUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email send");
    console.info(`Team invite for ${params.toEmail}: ${params.inviteUrl}`);
    return { id: "dev-mode" };
  }

  try {
    const emailHtml = await render(
      TeamInviteEmail({
        inviteUrl: params.inviteUrl,
        teamName: params.teamName,
        invitedByName: params.invitedByName,
        role: params.role,
      }),
      { pretty: false },
    );

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.toEmail,
      subject: `You've been invited to join ${params.teamName} on Quark`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send team invite email:", error);
      throw new Error("Failed to send team invite email");
    }

    return data;
  } catch (error) {
    console.error("Error sending team invite email:", error);
    throw error;
  }
}
