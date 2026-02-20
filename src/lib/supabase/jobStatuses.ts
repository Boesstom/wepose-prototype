import { createClient } from "@supabase/supabase-js"
// export type JobStatus = Tables<'job_statuses'> // (mocked below)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getJobStatuses() {
    const { data, error } = await supabase.from('job_statuses').select('*').order('name')
    if (error) {
        console.error("Error fetching job statuses:", error)
        // Fallback or handle missing table if not created yet (mock fallback for dev)
        return [
            { id: '1', name: "Employee" },
            { id: '2', name: "Business Owner" },
            { id: '3', name: "Freelance" },
            { id: '4', name: "Student" },
            { id: '5', name: "Housewife" },
            { id: '6', name: "Retiree" },
            { id: '7', name: "Unemployed" }
        ]
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
