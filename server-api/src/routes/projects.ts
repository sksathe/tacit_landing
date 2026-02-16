import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreateProjectSchema } from '../types/index.js';

const router = Router();

// Get all projects for the authenticated user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await req.supabaseClient!
      .from('projects')
      .select(`
        *,
        org:orgs(*),
        members:project_members(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ projects: data || [] });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

// Get a specific project
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabaseClient!
      .from('projects')
      .select(`
        *,
        org:orgs(*),
        members:project_members(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project: data });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project' });
  }
});

// Create a new project
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = CreateProjectSchema.parse(req.body);
    const userId = req.userId!;

    // Verify user has access to the org (by checking if they're a member of any project in that org)
    const { data: orgCheck, error: orgError } = await req.supabaseClient!
      .from('projects')
      .select('id')
      .eq('org_id', body.org_id)
      .limit(1);

    if (orgError) throw orgError;

    // Create project
    const { data: project, error: projectError } = await req.supabaseClient!
      .from('projects')
      .insert({
        org_id: body.org_id,
        name: body.name,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add creator as owner
    const { error: memberError } = await req.supabaseClient!
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;

    res.status(201).json({ project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.errors });
      return;
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

export default router;
