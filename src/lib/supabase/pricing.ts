
import { createClient } from '@/utils/supabase/client';
import { Visa } from '@/types/visa';

export interface AgentSpecialPrice {
  id: string;
  visa_id: string;
  agent_id: string;
  price: number;
  notes?: string;
  updated_at: string;
  agent?: {
    name: string;
    company_name?: string;
  };
}

export interface VisaCampaign {
  id: string;
  visa_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  rules: { min: number; max: number; price: number }[];
}

export interface VisaPricingView extends Visa {
  special_price_count: number;
  active_campaign_count: number;
}

export async function getPricingDashboardData() {
  const supabase = createClient();
  
  // Fetch visas with counts
  const { data: visas, error } = await supabase
    .from('visas')
    .select(`
      *,
      agent_special_prices(count),
      visa_campaigns(count)
    `)
    .order('name');

  if (error) throw error;

  return visas.map((v: any) => ({
    ...v,
    priceAgent: v.price_agent, // Map snake_case to camelCase
    special_price_count: v.agent_special_prices[0]?.count || 0,
    active_campaign_count: v.visa_campaigns[0]?.count || 0, // Simplified count, ideally filter active
  })) as VisaPricingView[];
}

export async function updateVisaPrice(id: string, updates: { price?: number; price_agent?: number }) {
  const supabase = createClient();
  const { error } = await supabase
    .from('visas')
    .update(updates)
    .eq('id', id);
    
  if (error) throw error;
}

export async function getAgentSpecialPrices(visaId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_special_prices')
    .select(`
      *,
      agent:agents(id, name, company_name)
    `)
    .eq('visa_id', visaId);
    
  if (error) throw error;
  return data as AgentSpecialPrice[];
}

// Re-implemented to be robust against PostgREST upsert quirks.
export async function upsertAgentSpecialPrice(priceData: { visa_id: string; agent_id: string; price: number; notes?: string }) {
  const supabase = createClient();
  
  try {
      // 1. Explicitly check for existing record using the unique composite key
      const { data: existing, error: findError } = await supabase
        .from('agent_special_prices')
        .select('id')
        .eq('visa_id', priceData.visa_id)
        .eq('agent_id', priceData.agent_id)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        // 2. Found existing record -> Update it
        const { error: updateError } = await supabase
          .from('agent_special_prices')
          .update({ 
              price: priceData.price, 
              notes: priceData.notes,
              last_updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        if (updateError) throw updateError;
      } else {
        // 3. No record found -> Insert new
        const { error: insertError } = await supabase
          .from('agent_special_prices')
          .insert({
              visa_id: priceData.visa_id,
              agent_id: priceData.agent_id,
              price: priceData.price,
              notes: priceData.notes,
              // Rely on default for last_updated_at to simplify
          });
          
        if (insertError) throw insertError;
      }
  } catch (error) {
      console.error("Upsert Agent Special Price Error:", error);
      throw error;
  }
}

export async function bulkUpsertAgentSpecialPrice(data: { visa_ids: string[], agent_id: string, price: number, notes?: string }) {
    // For bulk assigning a special price for ONE agent across MULTIPLE visas.
    for (const visaId of data.visa_ids) {
        await upsertAgentSpecialPrice({
            visa_id: visaId,
            agent_id: data.agent_id,
            price: data.price,
            notes: data.notes
        });
    }
}

export async function bulkUpsertAgentSpecialPrices(items: { visa_id: string, agent_id: string, price: number, notes?: string }[]) {
    // Determine unique agents to minimize loop if possible, but upsertAgentSpecialPrice handles distinct records.
    for (const item of items) {
        await upsertAgentSpecialPrice({
            visa_id: item.visa_id,
            agent_id: item.agent_id,
            price: item.price, 
            notes: item.notes
        });
    }
}

export async function deleteAgentSpecialPrice(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('agent_special_prices')
      .delete()
      .eq('id', id);
    if (error) throw error;
}

export async function getVisaCampaigns(visaId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('visa_campaigns')
    .select('*')
    .eq('visa_id', visaId);
    
  if (error) throw error;
  return data as VisaCampaign[];
}

export async function searchAgents(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, company_name')
    .ilike('name', `%${query}%`)
    .limit(10);
    
  if (error) throw error;
  return data;
}

export async function bulkUpdatePrices(
    visaIds: string[], 
    amount: number, 
    type: 'increase' | 'decrease' | 'set',
    target: 'price' | 'price_agent'
) {
    const supabase = createClient();
    
    // If 'set', we don't need to fetch current prices, just update the specific field.
    if (type === 'set') {
        const { error } = await supabase.from('visas')
            .update({ [target]: amount })
            .in('id', visaIds);
        if (error) throw error;
        return;
    }

    // For increase/decrease, we need to fetch current values
    const { data: visas } = await supabase
        .from('visas')
        .select(`id, ${target}`)
        .in('id', visaIds);
    
    if (!visas) return;

    // Prepare updates
    const updates = (visas as any[]).map(v => {
        const currentVal = v[target] || 0; // Handle nulls as 0
        let newVal = currentVal;

        if (type === 'increase') {
            newVal += amount;
        } else if (type === 'decrease') {
            newVal = Math.max(0, newVal - amount);
        }

        return {
            id: v.id,
            [target]: newVal
        };
    });
    
    // Perform updates sequentially (Supabase doesn't support bulk update with different values easily in one query without RPC)
    // or use upsert if we select all required fields? Upsert requires all non-nullable fields if not partial? 
    // update() on generic ID is fine.
    for (const update of updates) {
        await supabase.from('visas').update({ 
            [target]: update[target] 
        }).eq('id', update.id);
    }
}

export async function upsertVisaCampaign(campaign: Partial<VisaCampaign>) {
    const supabase = createClient();
    
    // Sanitize dates: empty string -> null
    const sanitized = {
        ...campaign,
        start_date: campaign.start_date || null,
        end_date: campaign.end_date || null,
    };

    if (sanitized.id) {
        const { error } = await supabase
            .from('visa_campaigns')
            .update(sanitized)
            .eq('id', sanitized.id);
        if (error) {
            console.error("Error updating campaign:", error, sanitized);
            throw error;
        }
    } else {
        // Remove undefined id for insert to let DB generate it
        const { id, ...toInsert } = sanitized; 
        
        const { error } = await supabase
            .from('visa_campaigns')
            .insert([toInsert]);
            
        if (error) throw error;
    }
}

export async function deleteVisaCampaign(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('visa_campaigns')
        .delete()
        .eq('id', id);
    if (error) throw error;
}


export async function bulkUpsertVisaCampaigns(campaigns: Partial<VisaCampaign>[]) {
    // We can use a loop for now or bulk insert if they are all new.
    // Given the structure, simple insert/update loop is safest.
    for (const campaign of campaigns) {
        await upsertVisaCampaign(campaign);
    }
}

export async function getAgentAllSpecialPrices(agentId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agent_special_prices')
        .select('visa_id, price, notes')
        .eq('agent_id', agentId);
        
    if (error) throw error;
    return data as { visa_id: string; price: number; notes?: string }[];
}

