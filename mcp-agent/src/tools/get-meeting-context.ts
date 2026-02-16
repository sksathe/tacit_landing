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

  // Generate agent hints based on meeting context
  const agentHints: string[] = [];
  if (meeting?.agenda) {
    agentHints.push(`Focus on: ${meeting.agenda}`);
  }
  if (project?.name) {
    agentHints.push(`Project context: ${project.name}`);
  }
  agentHints.push('Be conversational and help extract tacit knowledge');
  agentHints.push('Ask follow-up questions to clarify details');

  return {
    meeting: {
      title: meeting?.title || '',
      agenda: meeting?.agenda || null,
      scheduled_start_at: meeting?.scheduled_start_at || '',
      scheduled_end_at: meeting?.scheduled_end_at || '',
      meeting_code: meeting?.meeting_code || '',
    },
    invitee,
    agent_hints: agentHints,
  };
}
