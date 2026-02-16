import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

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
        meeting:meetings(*),
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

    // If transcript_path exists, you might want to fetch from storage
    // For now, return the transcript record
    res.json({ transcript: session.transcript });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transcript' });
  }
});

// Get summary for a session
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

export default router;
