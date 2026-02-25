import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { generateSummaryFromTranscriptRaw, generateClarityScoreFromTranscriptRaw } from '../services/llm.js';

const router = Router();

// Get all call sessions for a project
router.get('/project/:projectId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await req.supabaseClient!
      .from('call_sessions')
      .select(`
        *,
        meeting:meetings(*),
        transcript:transcripts(*),
        summary:summaries(*)
      `)
      .eq('project_id', projectId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    res.json({ sessions: data || [] });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
  }
});

// Get a specific call session with full details
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabaseClient!
      .from('call_sessions')
      .select(`
        *,
        meeting:meetings(*, meeting_invitees(*)),
        transcript:transcripts(*),
        summary:summaries(*),
        verified_invitee:meeting_invitees!verified_invitee_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session: data });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch session' });
  }
});

// Get transcript for a session (with storage path resolution if needed)
router.get('/:id/transcript', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: session, error: sessionError } = await req.supabaseClient!
      .from('call_sessions')
      .select('transcript_path, transcript:transcripts(*)')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Supabase one-to-many relation returns array; normalize to single transcript
    const transcript = Array.isArray(session.transcript) ? session.transcript[0] ?? null : session.transcript;
    res.json({ transcript });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transcript' });
  }
});

// Get latest summary for a session (backwards-compatible single record)
router.get('/:id/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: session, error: sessionError } = await req.supabaseClient!
      .from('call_sessions')
      .select('summary_path, summary:summaries(*)')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ summary: session.summary });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
});

// Get all summaries for a session (version history)
router.get('/:id/summaries', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabaseClient!
      .from('summaries')
      .select('*')
      .eq('call_session_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ summaries: data || [] });
  } catch (error: any) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch summaries' });
  }
});

// Generate (or regenerate) a summary for a session based on its transcript
router.post('/:id/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Load session + transcript
    const { data: session, error: sessionError } = await req.supabaseClient!
      .from('call_sessions')
      .select('id, org_id, project_id, transcript:transcripts(*)')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Supabase returns one-to-many relation as array; we only need the latest transcript
    const transcriptRecord = Array.isArray(session.transcript)
      ? session.transcript[0]
      : session.transcript;

    if (!transcriptRecord?.raw) {
      res.status(400).json({ error: 'No transcript available for this session. Make sure the call was finalized with a transcript.' });
      return;
    }

    const transcriptRaw = transcriptRecord.raw;

    // Generate summary with LLM, honoring optional tone / audience / instructions from the UI
    const { tone, audience, instructions } = req.body || {};
    const summary = await generateSummaryFromTranscriptRaw(transcriptRaw, {
      tone,
      audience,
      instructions,
    });

    // Upsert into summaries table
    const { data: existing, error: existingError } = await req.supabaseClient!
      .from('summaries')
      .select('id')
      .eq('call_session_id', id)
      .maybeSingle();

    if (existingError) throw existingError;

    let summaryRecord;
    if (existing) {
      const { data, error } = await req.supabaseClient!
        .from('summaries')
        .update({
          model: summary.model,
          summary_text: summary.summary_text,
          key_points: summary.key_points,
          action_items: summary.action_items,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      summaryRecord = data;
    } else {
      const { data, error } = await req.supabaseClient!
        .from('summaries')
        .insert({
          org_id: session.org_id,
          project_id: session.project_id,
          call_session_id: id,
          model: summary.model,
          summary_text: summary.summary_text,
          key_points: summary.key_points,
          action_items: summary.action_items,
        })
        .select()
        .single();

      if (error) throw error;
      summaryRecord = data;
    }

    res.json({ summary: summaryRecord });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
});

// Generate a "Clarity Scorer" style report for a session based on its transcript.
// This does NOT currently persist anything to the database; it simply returns
// a rich markdown report to the caller.
router.post('/:id/clarity-score', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Load session + transcript
    const { data: session, error: sessionError } = await req.supabaseClient!
      .from('call_sessions')
      .select('id, org_id, project_id, transcript:transcripts(*)')
      .eq('id', id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const transcriptRecord = Array.isArray(session.transcript)
      ? session.transcript[0]
      : session.transcript;

    if (!transcriptRecord?.raw) {
      res.status(400).json({
        error:
          'No transcript available for this session. Make sure the call was finalized with a transcript.',
      });
      return;
    }

    const transcriptRaw = transcriptRecord.raw;

    const { instructions } = req.body || {};
    const clarity = await generateClarityScoreFromTranscriptRaw(transcriptRaw, {
      instructions,
    });

    res.json({ clarity });
  } catch (error: any) {
    console.error('Error generating clarity score:', error);
    res.status(500).json({ error: error.message || 'Failed to generate clarity score' });
  }
});

export default router;
