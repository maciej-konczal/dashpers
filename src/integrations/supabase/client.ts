// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lftfifzcjiaaypkqxgxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdGZpZnpjamlhYXlwa3F4Z3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMTI5OTEsImV4cCI6MjA1NTc4ODk5MX0.2w8ZDxPM4_TyfnksVlm4ZnQTQQwNuayToYkX4UVmVW4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);