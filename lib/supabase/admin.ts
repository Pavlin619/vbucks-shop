// Service role key — bypasses RLS. `import 'server-only'` enforces
// route-handler/services-only consumption at build time.
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from '@/lib/env';

export const supabaseAdmin = createClient(
  getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
