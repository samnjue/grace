import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = //
const SUPABASE_KEY =
  //
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
