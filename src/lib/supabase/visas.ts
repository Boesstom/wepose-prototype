import { createClient } from "@/utils/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Visa = Tables<"visas">;
export type VisaInsert = TablesInsert<"visas">;
export type VisaUpdate = TablesUpdate<"visas">;
export type VisaDocument = Tables<"visa_documents">;
export type VisaDocumentInsert = TablesInsert<"visa_documents">;

// Extended type: visa with its documents
export type VisaWithDocuments = Visa & {
  visa_documents: (VisaDocument & {
    document: Tables<"documents">;
  })[];
};

const supabase = createClient();

// ─── READ ───────────────────────────────────────────────
export async function getVisas() {
  const { data, error } = await supabase
    .from("visas")
    .select(`
      *,
      visa_documents (
        *,
        document:documents (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as VisaWithDocuments[];
}

export async function getVisaById(id: string) {
  const { data, error } = await supabase
    .from("visas")
    .select(`
      *,
      visa_documents (
        *,
        document:documents (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as VisaWithDocuments;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createVisa(
  visa: VisaInsert,
  documents: { document_id: string; is_mandatory: boolean; notes?: string; config?: any }[]
) {
  // Insert visa
  const { data: visaData, error: visaError } = await supabase
    .from("visas")
    .insert(visa)
    .select()
    .single();

  if (visaError) throw visaError;

  // Insert visa documents if any
  if (documents.length > 0) {
    const visaDocuments = documents.map((doc) => ({
      visa_id: visaData.id,
      document_id: doc.document_id,
      is_mandatory: doc.is_mandatory,
      notes: doc.notes || "",
      config: doc.config || {},
    }));

    const { error: docError } = await supabase
      .from("visa_documents")
      .insert(visaDocuments);

    if (docError) throw docError;
  }

  return visaData;
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateVisa(
  id: string,
  visa: VisaUpdate,
  documents?: { document_id: string; is_mandatory: boolean; notes?: string; config?: any }[]
) {
  // Update visa
  const { data: visaData, error: visaError } = await supabase
    .from("visas")
    .update(visa)
    .eq("id", id)
    .select()
    .single();

  if (visaError) throw visaError;

  // If documents provided, replace all visa documents
  if (documents !== undefined) {
    // Delete existing visa documents
    const { error: deleteError } = await supabase
      .from("visa_documents")
      .delete()
      .eq("visa_id", id);

    if (deleteError) throw deleteError;

    // Insert new visa documents
    if (documents.length > 0) {
      const visaDocuments = documents.map((doc) => ({
        visa_id: id,
        document_id: doc.document_id,
        is_mandatory: doc.is_mandatory,
        notes: doc.notes || "",
        config: doc.config || {},
      }));

      const { error: insertError } = await supabase
        .from("visa_documents")
        .insert(visaDocuments);

      if (insertError) throw insertError;
    }
  }

  return visaData;
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteVisa(id: string) {
  // Delete related documents first (manual cascade)
  const { error: docError } = await supabase
    .from("visa_documents")
    .delete()
    .eq("visa_id", id);

  if (docError) throw docError;

  const { error } = await supabase
    .from("visas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
