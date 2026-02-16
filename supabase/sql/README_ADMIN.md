# Admin Guide: Assigning Users to Organizations and Projects

## Important: Users Table

**You do NOT have a custom users table.** This system uses Supabase's built-in `auth.users` table which is automatically managed by Supabase Auth.

- Users are stored in `auth.users` (managed by Supabase)
- User IDs (UUIDs) from `auth.users` are referenced in `project_members` table
- To see users: `SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;`

## Admin Assignment

**There is NO automatic admin assignment.** You must manually assign yourself (or any user) to organizations and projects using SQL.

Since email verification is disabled and users sign up directly, you need to manually assign them to organizations and projects.

## Quick Steps

### 1. Disable Email Confirmation in Supabase

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. **Turn it OFF** (disable it)
4. Save changes

This allows users to sign up and immediately log in without email verification.

### 2. Assign Yourself as Admin (First Time Setup)

**If you're the first admin**, run `06_setup_first_admin.sql`:

1. Sign up via the frontend (`/login` page)
2. Note your email address
3. Open `supabase/sql/06_setup_first_admin.sql`
4. Replace `'your-email@example.com'` with YOUR actual email
5. Optionally change org/project names
6. Run in Supabase SQL Editor

This creates an org, a project, and assigns you as 'owner'.

### 3. Assign Other Users to Organization and Project

After other users sign up, run the SQL script `05_admin_assign_user.sql` in Supabase SQL Editor:

**Option A: Using the provided script**
1. Open `supabase/sql/05_admin_assign_user.sql`
2. Replace placeholders:
   - `'Your Organization Name'` → actual org name
   - `'Project Name'` → actual project name
   - `'user@example.com'` → user's email
   - `'owner'` → role (owner/admin/member)
3. Run in Supabase SQL Editor

**Option B: Quick one-liner**
```sql
-- Create org, project, and assign user in one go
WITH new_org AS (
  INSERT INTO orgs (name) VALUES ('My Org') RETURNING id
),
new_project AS (
  INSERT INTO projects (org_id, name) 
  SELECT id, 'My Project' FROM new_org 
  RETURNING id
)
INSERT INTO project_members (project_id, user_id, role)
SELECT 
  (SELECT id FROM new_project),
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'owner';
```

### 4. Check User Access

```sql
-- See all users and their project access
SELECT 
  u.email,
  p.name as project_name,
  o.name as org_name,
  pm.role
FROM auth.users u
JOIN project_members pm ON u.id = pm.user_id
JOIN projects p ON pm.project_id = p.id
JOIN orgs o ON p.org_id = o.id
ORDER BY u.created_at DESC;
```

## Common Admin Tasks

### Create a new organization
```sql
INSERT INTO orgs (name) VALUES ('New Organization Name');
```

### Create a project in an org
```sql
INSERT INTO projects (org_id, name)
VALUES (
  (SELECT id FROM orgs WHERE name = 'Organization Name'),
  'New Project Name'
);
```

### Add user to existing project
```sql
INSERT INTO project_members (project_id, user_id, role)
VALUES (
  (SELECT id FROM projects WHERE name = 'Project Name'),
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'member'  -- or 'owner' or 'admin'
);
```

### Remove user from project
```sql
DELETE FROM project_members
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
  AND project_id = (SELECT id FROM projects WHERE name = 'Project Name');
```

### Change user role in project
```sql
UPDATE project_members
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
  AND project_id = (SELECT id FROM projects WHERE name = 'Project Name');
```

## Notes

- Users can sign up and log in immediately (no email verification)
- Users **cannot** see any projects until you add them to `project_members` table
- RLS policies ensure users only see projects they're members of
- The first user you create should be assigned as 'owner' role
- You can create multiple projects per organization
- Users can belong to multiple projects
