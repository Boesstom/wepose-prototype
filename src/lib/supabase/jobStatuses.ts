import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export type JobStatus = Database['public']['Tables']['job_statuses']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function getJobStatuses() {
    const { data, error } = await supabase.from('job_statuses').select('*').order('name')
    if (error) {
        console.error("Error fetching job statuses:", error.message || error)
        return []
    }
    return data
}

export async function addJobStatus(name: string) {
    const { data, error } = await supabase.from('job_statuses').insert([{ name }]).select().single()
    if (error) {
        console.error("Error adding job status:", error)
        return null
    }
    return data
}
