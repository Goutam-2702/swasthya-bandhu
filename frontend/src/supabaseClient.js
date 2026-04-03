import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase Project URL and Anon Key
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://abdblukbngbapatrqvkr.supabase.co';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZGJsdWtibmdiYXBhdHJxdmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzMyMTUsImV4cCI6MjA5MDI0OTIxNX0.EG0iuvAJvJEUzRWMnvi-wVqhAd12DOBAuM9g0IsCoJQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
