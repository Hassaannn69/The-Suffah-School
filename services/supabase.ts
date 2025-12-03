import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);