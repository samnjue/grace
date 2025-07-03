import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = //not today
const SUPABASE_KEY = //not tmrw
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

