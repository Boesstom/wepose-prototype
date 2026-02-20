import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database";

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export async function getAgents() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function createAgent(agent: AgentInsert) {
  const supabase = createClient();
  const { data, error } = await supabase.from("agents").insert(agent).select().single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAgent(id: string, agent: AgentUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .update(agent)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAgent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("agents").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
