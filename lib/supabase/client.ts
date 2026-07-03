"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Used for auth actions (sign in/out) and for
// reading/writing the current user's saved_items, which RLS scopes to auth.uid().
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
