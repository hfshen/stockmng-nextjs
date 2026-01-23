'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/components/LanguageContext'
import { Lock, Mail, Loader2, Building2 } from 'lucide-react'
import { handleError } from '@/lib/utils'

export default function Login() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.session) {
                // 로그인 성공 시 인벤토리로 이동
                router.push('/inventory')
            }
        } catch (error) {
            handleError(error, '로그인')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding Area */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded bg-white/10 backdrop-blur-sm border border-white/20" />
                        <span className="font-bold text-xl tracking-tight">StockMng</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Smart Inventory<br />Management System
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-md">
                        실시간 재고 추적, 자동 발주 관리, 그리고 업체간 원활한 소통을 위한 통합 솔루션입니다.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8 text-sm text-zinc-500">
                    <div>
                        <h3 className="font-semibold text-white mb-2">Secure & Reliable</h3>
                        <p>엔터프라이즈급 보안과 안정적인 클라우드 인프라를 제공합니다.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-2">Real-time Sync</h3>
                        <p>모든 데이터가 실시간으로 동기화되어 언제 어디서나 확인 가능합니다.</p>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">로그인</h2>
                        <p className="mt-2 text-zinc-500">서비스 이용을 위해 계정에 로그인해주세요.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">이메일</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    로그인 중...
                                </>
                            ) : (
                                '로그인'
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-zinc-500">Test Account Info</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center text-xs text-zinc-400">
                            <p>테스트를 위해 Supabase Auth에서 사용자를 생성해주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
