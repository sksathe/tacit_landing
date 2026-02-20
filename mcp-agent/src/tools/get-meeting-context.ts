import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { GetMeetingContextSchema, GetMeetingContextResponse } from '../types/index.js';

export async function getMeetingContext(
  input: z.infer<typeof GetMeetingContextSchema>
): Promise<GetMeetingContextResponse> {
  const { call_session_id } = input;

  const { data: callSession, error: sessionError } = await supabase
    .from('call_sessions')
    .select(`
      meeting_id,
      verified_invitee_id,
      meeting:meetings(
        title,
        agenda,
        scheduled_start_at,
        scheduled_end_at,
        meeting_code,
        project:projects(name)
      )
    `)
    .eq('id', call_session_id)
    .single();

  if (sessionError || !callSession) {
    throw new Error(`Call session not found: ${call_session_id}`);
  }

  const meeting = callSession.meeting as any;
  const project = meeting?.project as any;

  let invitee = null;
  if (callSession.verified_invitee_id) {
    const { data: inviteeData } = await supabase
      .from('meeting_invitees')
      .select('name, email')
      .eq('id', callSession.verified_invitee_id)
      .single();

    if (inviteeData) {
      invitee = {
        name: inviteeData.name,
        email: inviteeData.email,
      };
    }
  }

  const hasAgenda = meeting?.agenda && String(meeting.agenda).trim().length > 0;

  const agentHints: string[] = [];
  if (hasAgenda) {
    agentHints.push('Stick to the agenda: cover the topics listed in the agenda; do not go off-topic.');
    agentHints.push(`Agenda to follow: ${meeting!.agenda}`);
    agentHints.push('Introduce and discuss each agenda item; keep the conversation focused on these points.');
  } else {
    agentHints.push(
      'No agenda was provided for this call. Say to the user: "No agenda was given for the call. What would you like to discuss?" Then let the user set the topics and follow their lead.'
    );
    agentHints.push('Be conversational and help extract tacit knowledge on whatever topics the user wants to cover.');
  }
  if (meeting?.title) {
    agentHints.push(`Meeting title: ${meeting.title}. Use this to frame the conversation.`);
  }
  if (project?.name) {
    agentHints.push(`Project context: ${project.name}`);
  }
  if (hasAgenda) {
    agentHints.push('Be conversational and help extract tacit knowledge.');
  }
  agentHints.push(hasAgenda
    ? 'Ask follow-up questions to clarify details while staying on agenda topics.'
    : 'Ask follow-up questions to clarify details.');

  return {
    meeting: {
      title: meeting?.title || '',
      agenda: hasAgenda ? meeting!.agenda : null,
      scheduled_start_at: meeting?.scheduled_start_at || '',
      scheduled_end_at: meeting?.scheduled_end_at || '',
      meeting_code: meeting?.meeting_code || '',
    },
    invitee,
    agent_hints: agentHints,
    /** When no agenda: exact phrase for the agent to say to the user. */
    no_agenda_opening: hasAgenda ? null : 'No agenda was given for the call. What would you like to discuss?',
  };
}
