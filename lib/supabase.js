// lib/supabase.js

import { createClient } from '@supabase/supabase-js';

// Για χρήση στο frontend (π.χ. client-side fetch)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Για χρήση σε API routes (server-only)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
