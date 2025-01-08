import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dabljjonrpbnidwnkwgz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYmxqam9ucnBibmlkd25rd2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTE2MjMxMiwiZXhwIjoyMDQ2NzM4MzEyfQ.zCTqC188P8VBkUOAo8n7jDkS4nlOaz8q1ZYhfQk2JgQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

