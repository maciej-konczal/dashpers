
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lftfifzcjiaaypkqxgxc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdGZpZnpjamlhYXlwa3F4Z3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMTI5OTEsImV4cCI6MjA1NTc4ODk5MX0.2w8ZDxPM4_TyfnksVlm4ZnQTQQwNuayToYkX4UVmVW4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
