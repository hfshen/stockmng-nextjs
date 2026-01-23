'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase' // Client for public table checks if needed, but admin is better for all

export async function createCompany(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('companyName') as string

    if (!email || !password || !companyName) {
        return { success: false, message: '모든 필드를 입력해주세요.' }
    }

    try {
        // 1. Create User in Supabase Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirm
            user_metadata: { company_name: companyName }
        })

        if (userError) throw userError
        if (!userData.user) throw new Error('유저 생성 실패')

        // 2. Insert into company_accounts
        // Note: We use supabaseAdmin here to bypass RLS policies if necessary, 
        // or we rely on the fact that we are inserting a new record.
        // However, since we might have RLS "Users can view their own company account",
        // inserting might be restricted if not authenticated as that user.
        // Using admin client ensures we can write regardless of RLS.
        const { error: dbError } = await supabaseAdmin
            .from('company_accounts')
            .insert({
                company_name: companyName,
                username: email.split('@')[0], // Simple username generation
                auth_user_id: userData.user.id,
                password_hash: 'managed_by_supabase_auth' // Legacy field
            })

        if (dbError) {
            // Rollback: Delete user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
            throw dbError
        }

        return { success: true, message: '업체 및 계정이 성공적으로 생성되었습니다.' }

    } catch (error: any) {
        console.error('Create Company Error:', error)
        return { success: false, message: error.message || '알 수 없는 오류가 발생했습니다.' }
    }
}
