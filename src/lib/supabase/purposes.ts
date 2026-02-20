import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export interface Purpose {
  id: string;
  name: string;
}

export async function getPurposes(): Promise<Purpose[]> {
  const { data, error } = await supabase
    .from('purposes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching purposes:', error);
    return [];
  }

  return data || [];
}

export async function addPurpose(name: string): Promise<Purpose | null> {
  const { data, error } = await supabase
    .from('purposes')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    console.error('Error adding purpose:', error);
    return null;
  }

  return data;
}
