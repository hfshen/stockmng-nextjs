'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Calendar, Building2, Eye, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase, BoardPost } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { handleError } from '@/lib/utils'
import { useLanguage } from '@/components/LanguageContext'

export default function BoardList() {
    const { showToast } = useToast()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<BoardPost[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const ITEMS_PER_PAGE = 15

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('board_posts')
                .select('*', { count: 'exact' })
                .order('is_notice', { ascending: false }) // 공지사항 우선
                .order('created_at', { ascending: false })
                .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

            if (search) {
                query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
            }

            const { data, error, count } = await query

            if (error) throw error
            setPosts(data || [])
            setHasMore((count || 0) > page * ITEMS_PER_PAGE)
        } catch (error) {
            handleError(error, '게시글 목록')
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchPosts()
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">업체 게시판</h1>
                        <p className="text-zinc-500 mt-2">공지사항 및 특이사항을 공유하는 공간입니다.</p>
                    </div>
                    <Link href="/board/write">
                        <button className="flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium">
                            <Plus className="w-4 h-4 mr-2" />
                            글쓰기
                        </button>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="mb-6 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="제목 + 내용 검색"
                                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                            />
                        </div>
                        <button type="submit" className="px-6 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 text-sm font-medium transition-colors">
                            조회
                        </button>
                    </form>
                </div>

                {/* Board List */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-20">번호</th>
                                    <th className="px-6 py-4 font-semibold">제목</th>
                                    <th className="px-6 py-4 font-semibold w-32">업체명</th>
                                    <th className="px-6 py-4 font-semibold w-32">작성자</th>
                                    <th className="px-6 py-4 font-semibold w-40">등록일시</th>
                                    <th className="px-6 py-4 font-semibold w-20 text-center">조회</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {posts.map((post) => (
                                    <tr key={post.id} className={`hover:bg-zinc-50 transition-colors ${post.is_notice ? 'bg-zinc-50/50' : ''}`}>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {post.is_notice ? <span className="text-red-500 font-bold">공지</span> : post.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/board/${post.id}`} className="block group">
                                                <span className="text-zinc-900 group-hover:text-blue-600 font-medium transition-colors">
                                                    {post.title}
                                                </span>
                                                {post.is_notice && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 text-red-800">NOTICE</span>}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100">
                                                <Building2 className="w-3 h-3" />
                                                {post.company_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600">{post.author}</td>
                                        <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                            {new Date(post.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 text-center">{post.view_count}</td>
                                    </tr>
                                ))}
                                {loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> 목록 로딩중...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && posts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                            게시글이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-zinc-100 px-6 py-4 flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm disabled:opacity-50 hover:bg-zinc-50"
                        >
                            이전
                        </button>
                        <span className="text-sm text-zinc-600">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore}
                            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm disabled:opacity-50 hover:bg-zinc-50"
                        >
                            다음
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
