# CONTROL Resourcebook

## Supabase

1. Create a Supabase project, then run the SQL in `supabase/migrations/20260816031155_create_resourcebook_schema.sql` in its SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. In **Authentication → URL Configuration**, add the deployed Vercel URL as the Site URL and redirect URL.
4. Keep public sign-ups disabled, or invite only the people who may edit. The schema grants all signed-in users edit access.

The first signed-in edit copies the bundled starter resources into Supabase; subsequent reads and edits use the database.

## Vercel

Deploy this directory as its own Vercel project. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development before promoting the deployment.
