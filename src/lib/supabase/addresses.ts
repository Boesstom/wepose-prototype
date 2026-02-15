import { createClient } from "@/utils/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Address = Tables<"addresses">;
export type AddressInsert = TablesInsert<"addresses">;
export type AddressUpdate = TablesUpdate<"addresses">;

const supabase = createClient();

// ─── READ ───────────────────────────────────────────────
export async function getAddresses() {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCountries() {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .is("parent_id", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCities() {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .not("parent_id", "is", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCitiesByCountry(countryId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("parent_id", countryId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAddressById(id: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createAddress(address: AddressInsert) {
  const { data, error } = await supabase
    .from("addresses")
    .insert(address)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateAddress(id: string, updates: AddressUpdate) {
  const { data, error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteAddress(id: string) {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
