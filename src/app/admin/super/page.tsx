'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createCompany } from '@/app/actions/admin'
import { ArrowLeft, Building2, UserPlus, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

// Types
interface Company {
    id: number
    company_name: string
    username: string
    created_at: string
}

export default function SuperAdminPage() {
    const router = useRouter()
    const { showToast } = useToast()

    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        checkAdmin()
        loadCompanies()
    }, [])

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        // Hardcoded Super Admin Check
        if (user && user.email === 'info@lolovely.com') {
            setIsAdmin(true)
            setLoading(false)
        } else {
            router.push('/inventory') // Redirect unauthorized
        }
    }

    const loadCompanies = async () => {
        // Note: This might fail if RLS prevents seeing other companies.
        // For a real Super Admin, we might need a separate API route backed by supabase-admin
        // OR update RLS to allow 'info@lolovely.com' to see all.
        // For now, let's try standard fetch. If it fails (due to RLS), 
        // we would typically implement a Server Component or API for the list.

        // BUT since we are Client Side, RLS applies.
        // *Critical*: We defined RLS "Users can view their own company account".
        // So 'info@lolovely.com' cannot see others unless we added that exception in SQL.
        // Let's assume for this step the user wants the "Create" feature primarily.
        // We will handle the list view limitations later or if requested.

        try {
            const { data, error } = await supabase.from('company_accounts').select('*')
            if (!error) setCompanies(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreate = async (formData: FormData) => {
        setIsSubmitting(true)
        const result = await createCompany(formData)
        setIsSubmitting(false)

        if (result.success) {
            showToast(result.message, 'success')
            // Reset form manually or reload
            window.location.reload()
        } else {
            showToast(result.message, 'error')
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    if (!isAdmin) return null

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <Link href="/inventory" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        돌아가기
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-lg text-white">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Super Admin Dashboard</h1>
                            <p className="text-zinc-500">업체 및 계정 관리</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Create Company Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-zinc-500" />
                                신규 업체 등록
                            </h2>
                            <form action={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">업체명</label>
                                    <input name="companyName" type="text" required className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="예: SR International" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">관리자 이메일</label>
                                    <input name="email" type="email" required className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="admin@company.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
                                    <input name="password" type="password" required className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="••••••••" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center items-center py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 text-sm font-medium"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '업체 생성'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Company List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                                <h2 className="font-semibold text-zinc-900">등록된 업체 목록 ({companies.length})</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-zinc-500 bg-zinc-50 border-b border-zinc-100">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">업체명</th>
                                            <th className="px-6 py-3 font-medium">사용자명</th>
                                            <th className="px-6 py-3 font-medium">등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {companies.map((company) => (
                                            <tr key={company.id} className="hover:bg-zinc-50">
                                                <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                                    {company.company_name}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">{company.username}</td>
                                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{new Date(company.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {companies.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                                    목록을 불러올 수 없거나 등록된 업체가 없습니다.<br />
                                                    (RLS 정책으로 인해 목록이 보이지 않을 수 있습니다)
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
