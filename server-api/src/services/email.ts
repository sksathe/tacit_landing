import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER || '+1 (980) 499-5308';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface AgentCardForEmail {
  name: string;
  tagline: string;
  role: string;
  persona: string;
  description: string;
  descriptionContinued?: string;
  specialties: string[];
}

export interface MeetingInviteEmailParams {
  inviteeName: string;
  inviteeEmail: string;
  meetingTitle: string;
  meetingCode: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  agenda?: string;
  agentName?: string;
  agentCard?: AgentCardForEmail;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSessionScheduledHtml(params: {
  first_name: string;
  date_human: string;
  time_human: string;
  timezone: string;
  call_title: string;
  agent_name: string;
  twilio_number: string;
  access_code: string;
  agenda_text: string;
  agent_card?: AgentCardForEmail;
}): string {
  const {
    first_name,
    date_human,
    time_human,
    timezone,
    call_title,
    agent_name,
    twilio_number,
    access_code,
    agenda_text,
    agent_card,
  } = params;
  const f = escapeHtml;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Scheduled</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header: purple-blue gradient (fallback solid for some clients) -->
          <tr>
            <td style="background-color: #6366f1; background: linear-gradient(90deg, #7c3aed 0%, #2563eb 100%); padding: 32px 28px 28px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: left;">
                    <span style="font-size: 12px; font-weight: 600; color: #e0e7ff; letter-spacing: 0.08em;">TACIT</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; text-align: center;">
                    <span style="font-size: 11px; color: rgba(255,255,255,0.9);">&#128222;</span>
                    <span style="display: inline-block; font-size: 26px; font-weight: 700; color: #ffffff; margin-left: 6px; vertical-align: middle;">Session Scheduled</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px; text-align: center;">
                    <p style="margin: 0; font-size: 15px; color: #ffffff; font-weight: 500;">Hi ${f(first_name)}, your phone session is confirmed.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main content -->
          <tr>
            <td style="padding: 28px 28px 32px;">
              <!-- Session Details card -->
              <p style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #1f2937;">Session Details</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; padding: 20px;">
                <tr><td style="padding: 6px 0;"><span style="font-size: 12px; color: #6b7280;">When</span><br><span style="font-size: 14px; font-weight: 600; color: #1f2937;">${f(date_human)} &#8226; ${f(time_human)} (${f(timezone)})</span></td></tr>
                <tr><td style="padding: 6px 0;"><span style="font-size: 12px; color: #6b7280;">Session Title</span><br><span style="font-size: 14px; font-weight: 600; color: #1f2937;">${f(call_title)}</span></td></tr>
                <tr><td style="padding: 6px 0;"><span style="font-size: 12px; color: #6b7280;">Agent</span><br><span style="font-size: 14px; font-weight: 600; color: #1f2937;">${f(agent_name)}</span></td></tr>
                <tr><td style="padding: 6px 0;"><span style="font-size: 12px; color: #6b7280;">Call-in Number</span><br><span style="font-size: 14px; font-weight: 600; color: #1f2937;">${f(twilio_number)}</span></td></tr>
                <tr><td style="padding: 6px 0;"><span style="font-size: 12px; color: #6b7280;">Access Code</span><br><span style="font-size: 14px; font-weight: 600; color: #1f2937;">${f(access_code)}</span></td></tr>
              </table>
${agent_card ? `
              <!-- Agent card -->
              <p style="margin: 24px 0 10px; font-size: 15px; font-weight: 700; color: #1f2937;">Your session agent</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 10px; border: 1px solid #c4b5fd; padding: 20px;">
                <tr><td>
                  <p style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #5b21b6;">${f(agent_card.name)}</p>
                  <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #6d28d9;">${f(agent_card.tagline)}</p>
                  <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280;">Role</p>
                  <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">${f(agent_card.role)}</p>
                  <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280;">Persona</p>
                  <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">${f(agent_card.persona)}</p>
                  <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280;">Description</p>
                  <p style="margin: 0 0 6px; font-size: 13px; color: #374151; line-height: 1.5;">${f(agent_card.description)}</p>
                  ${agent_card.descriptionContinued ? `<p style="margin: 0 0 10px; font-size: 13px; color: #374151; line-height: 1.5;">${f(agent_card.descriptionContinued)}</p>` : ''}
                  <p style="margin: 10px 0 4px; font-size: 11px; color: #6b7280;">Specialties</p>
                  <ul style="margin: 0 0 0 18px; padding: 0; font-size: 13px; color: #374151; line-height: 1.6;">
                    ${agent_card.specialties.map((s) => `<li style="margin: 2px 0;">${f(s)}</li>`).join('')}
                  </ul>
                </td></tr>
              </table>
` : ''}

              <p style="margin: 20px 0 6px; font-size: 15px; font-weight: 700; color: #1f2937;">How to join:</p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #374151; line-height: 1.5;">Dial ${f(twilio_number)}, say your name when prompted, then enter access code ${f(access_code)}.</p>

              <p style="margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #1f2937;">Agenda</p>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${f(agenda_text)}</p>

              <p style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">If you didn't schedule this session, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendMeetingInviteEmail(params: MeetingInviteEmailParams): Promise<void> {
  if (!resend) {
    console.warn('⚠️ Resend API key not configured, skipping email send');
    console.warn('💡 Set RESEND_API_KEY in server-api/.env to enable email sending');
    return;
  }

  const { inviteeName, inviteeEmail, meetingTitle, meetingCode, scheduledStartAt, scheduledEndAt, agenda, agentName, agentCard } = params;

  const first_name = inviteeName.split(/\s+/)[0] || inviteeName;
  const start = new Date(scheduledStartAt);
  const date_human = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const time_human = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  const agenda_text = agenda && agenda.trim() ? agenda.trim() : 'No agenda provided.';

  const html = buildSessionScheduledHtml({
    first_name,
    date_human,
    time_human,
    timezone,
    call_title: meetingTitle,
    agent_name: agentName || agentCard?.name || 'Tacit Voice Agent',
    twilio_number: TWILIO_NUMBER,
    access_code: meetingCode,
    agenda_text,
    agent_card: agentCard,
  });

  const textBody = `
Hello ${inviteeName},

Your phone session is confirmed.

When: ${date_human} at ${time_human} (${timezone})
Session: ${meetingTitle}
Call-in: ${TWILIO_NUMBER}
Access code: ${meetingCode}

How to join: Dial ${TWILIO_NUMBER}, say your name when prompted, then enter access code ${meetingCode}.

Agenda: ${agenda_text}

— Tacit
  `.trim();

  try {
    const result = await resend.emails.send({
      from: 'Tacit <noreply@scenergy.design>',
      to: inviteeEmail,
      subject: `Session Scheduled: ${meetingTitle}`,
      text: textBody,
      html,
    });

    console.log(`✅ Email sent successfully to ${inviteeEmail}:`, (result as { data?: { id?: string } })?.data?.id ?? result);
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
