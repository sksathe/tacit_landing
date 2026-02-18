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
    console.warn('⚠️ Resend API key not configured, skipping email send');
    console.warn('💡 Set RESEND_API_KEY in server-api/.env to enable email sending');
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
2. When the agent answers, say your 4-digit meeting code: "${meetingCode}"
3. Then say your full name: "${inviteeName}"

The AI agent will verify your identity and guide you through the knowledge capture session.

Best regards,
Tacit Team
  `.trim();

  try {
    const result = await resend.emails.send({
      from: 'Tacit <noreply@scenergy.design>', // Use Resend's test domain for now
      to: inviteeEmail,
      subject: `Tacit Session Invitation: ${meetingTitle}`,
      text: emailBody,
    });
    
    console.log(`✅ Email sent successfully to ${inviteeEmail}:`, result.id);
  } catch (error: any) {
    // Log detailed error but don't throw - meeting creation should succeed even if email fails
    console.error(`❌ Failed to send email to ${inviteeEmail}:`, error);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      statusCode: error?.statusCode,
    });
    
    // Provide helpful error message
    if (error?.message?.includes('domain')) {
      console.error('💡 Tip: Verify your domain in Resend dashboard or use onboarding@resend.dev for testing');
    }
    if (error?.message?.includes('API key')) {
      console.error('💡 Tip: Check your RESEND_API_KEY in server-api/.env');
    }
    
    // Don't throw - let meeting creation succeed even if email fails
    // The error is already logged for debugging
  }
}
