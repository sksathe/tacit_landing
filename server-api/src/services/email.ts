import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER || '+1234567890';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface MeetingInviteEmailParams {
  inviteeName: string;
  inviteeEmail: string;
  meetingTitle: string;
  meetingCode: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  agenda?: string;
}

export async function sendMeetingInviteEmail(params: MeetingInviteEmailParams): Promise<void> {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return;
  }

  const { inviteeName, inviteeEmail, meetingTitle, meetingCode, scheduledStartAt, scheduledEndAt, agenda } = params;

  const startDate = new Date(scheduledStartAt).toLocaleString();
  const endDate = new Date(scheduledEndAt).toLocaleString();

  const emailBody = `
Hello ${inviteeName},

You've been invited to a Tacit knowledge capture session.

Meeting Details:
- Title: ${meetingTitle}
- Scheduled Time: ${startDate} - ${endDate}
${agenda ? `- Agenda: ${agenda}` : ''}

Your Meeting Code: ${meetingCode}

Instructions:
1. Call our Twilio number at the scheduled time: ${TWILIO_NUMBER}
2. When the agent answers, say your name and meeting code: "${inviteeName}, ${meetingCode}"

The AI agent will verify your identity and guide you through the knowledge capture session.

Best regards,
Tacit Team
  `.trim();

  try {
    await resend.emails.send({
      from: 'Tacit <noreply@tacit.ai>', // Update with your verified domain
      to: inviteeEmail,
      subject: `Tacit Session Invitation: ${meetingTitle}`,
      text: emailBody,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send meeting invite email');
  }
}
