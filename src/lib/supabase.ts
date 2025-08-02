import { createClient } from "@supabase/supabase-js";

// These will be public keys, safe to expose
const supabaseUrl = "https://udyuyhbqnbamixqcosqm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeXV5aGJxbmJhbWl4cWNvc3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjM3NjcsImV4cCI6MjA2OTY5OTc2N30.Jwbs5R7X1SQFVGTyVNiKWeOxJ_SKjf-nRN8s-Ax9NCs"; // We'll replace this after creating the project

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = "wedding-photos";
