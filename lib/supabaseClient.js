// lib/supabaseClient.js
//
// Single shared Supabase client used across the whole app (browser-side).
// Reads the public URL + anon key from environment variables, which are
// safe to expose to the browser because Row Level Security (RLS) on the
// tables is what actually protects the data (see supabase/schema.sql).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in development if env vars are missing, instead of a
  // confusing runtime error deep inside a Supabase call.
  console.warn(
    'Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your project values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
