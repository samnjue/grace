import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dabljjonrpbnidwnkwgz.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYmxqam9ucnBibmlkd25rd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNjIzMTIsImV4cCI6MjA0NjczODMxMn0.heJ-OmceVakcQElnBp7tXYsxyHnMR5hhg4xR6R0A03o";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
