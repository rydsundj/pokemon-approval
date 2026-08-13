import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// A single shared Supabase client for the whole app.
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 2 } },
  },
);
