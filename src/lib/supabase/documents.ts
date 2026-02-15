import { createClient } from "@/utils/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Document = Tables<"documents">;
export type DocumentInsert = TablesInsert<"documents">;
export type DocumentUpdate = TablesUpdate<"documents">;

const supabase = createClient();

// ─── READ ───────────────────────────────────────────────
export async function getDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getDocumentById(id: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createDocument(doc: DocumentInsert) {
  const { data, error } = await supabase
    .from("documents")
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateDocument(id: string, updates: DocumentUpdate) {
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
