// WARNING: This module uses the Supabase service role key, which bypasses
// Row Level Security. Import ONLY from app/api/** route handlers — NEVER
// from components, Server Components, or client-side code.
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
