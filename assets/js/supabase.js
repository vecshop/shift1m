import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Ganti dengan URL dan key proyek Anda
const SUPABASE_URL = "https://xedmvktpwtkwcpafcqpo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZG12a3Rwd3Rrd2NwYWZjcXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2OTk2NDUsImV4cCI6MjA1MDI3NTY0NX0.0tH3rWhugpxESaUQOUkZNWNJ8ck9m7m5nPE80z0D7BU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
