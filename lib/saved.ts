import { createClient } from "@/lib/supabase/client";

export type SavedModule = "hypothesis" | "financial-model" | "tangible-assets" | "consistency";

export interface SavedItem {
  id: string;
  module: SavedModule;
  title: string;
  payload: any;
  created_at: string;
  updated_at: string;
}

// Persists a module's current state (input + generated output + review
// decisions) so it can be reopened later. Requires an authenticated user —
// RLS on saved_items scopes every row to auth.uid().
export async function saveItem(module: SavedModule, title: string, payload: unknown) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to save this engagement.");

  const { data, error } = await supabase
    .from("saved_items")
    .insert({ user_id: user.id, module, title: title || "Untitled", payload })
    .select()
    .single();
  if (error) throw error;
  return data as SavedItem;
}

export async function listItems(module?: SavedModule): Promise<SavedItem[]> {
  const supabase = createClient();
  let query = supabase.from("saved_items").select("*").order("created_at", { ascending: false });
  if (module) query = query.eq("module", module);
  const { data, error } = await query;
  if (error) throw error;
  return (data as SavedItem[]) ?? [];
}

export async function getItem(id: string): Promise<SavedItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saved_items").select("*").eq("id", id).single();
  if (error) return null;
  return data as SavedItem;
}

export async function deleteItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("saved_items").delete().eq("id", id);
  if (error) throw error;
}
