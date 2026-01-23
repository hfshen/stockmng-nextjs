import { createClient } from '@supabase/supabase-js'

// Note: This client should ONLY be used in server-side contexts (API routes, Server Actions, getServerSideProps).
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client-side.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
