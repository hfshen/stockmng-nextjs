'use client'

// React hooks and Next.js navigation
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// UI Icons from Lucide
import { ArrowLeft, Clock, Eye, User, FileText, Download, Building2, Loader2, Share2, Printer } from 'lucide-react'

// Supabase client and types
import { supabase, BoardPost, BoardFile } from '@/lib/supabase'
import { handleError } from '@/lib/utils'

export default function BoardDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()

    // State management
    const [post, setPost] = useState<BoardPost | null>(null)
    const [files, setFiles] = useState<BoardFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch data on mount
    useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            // Unwrap params
            const resolvedParams = await params
            const postId = resolvedParams.id

            try {
                setLoading(true)

                // 1. Fetch Post Detail
                const { data: postData, error: postError } = await supabase
                    .from('board_posts')
                    .select('*')
                    .eq('id', postId)
                    .single()

                if (postError) throw postError
                if (isMounted) setPost(postData)

                // 2. Increment View Count
                await supabase.rpc('increment_view_count', { post_id: postId }).catch(() => {
                    // RPC가 없으면 클라이언트 사이드 업데이트 시도 (덜 정확함)
                    supabase.from('board_posts').update({ view_count: (postData.view_count || 0) + 1 }).eq('id', postId)
                })

                // 3. Fetch Files
                const { data: filesData, error: filesError } = await supabase
                    .from('board_files')
                    .select('*')
                    .eq('post_id', postId)

                if (filesError) throw filesError
                if (isMounted) setFiles(filesData || [])

            } catch (err) {
                if (isMounted) {
                    handleError(err, '게시글 상세')
                    setError('게시글을 불러올 수 없습니다.')
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()

        return () => { isMounted = false }
    }, [params])

    // Handlers
    const handleDownload = (url: string, fileName: string) => {
        // For direct public URL downloads
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Loading View
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex justify-center items-center">
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>게시글을 불러오는 중입니다...</p>
                </div>
            </div>
        )
    }

    // Error View
    if (error || !post) {
        return (
            <div className="min-h-screen bg-zinc-50 flex justify-center items-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">오류가 발생했습니다</h2>
                    <p className="text-zinc-500 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
                    <Link href="/board">
                        <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm">목록으로 돌아가기</button>
                    </Link>
                </div>
            </div>
        )
    }

    // Main View
    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Navigation */}
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/board" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        목록으로
                    </Link>
                    <div className="flex gap-2">
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="공유하기">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" onClick={() => window.print()} title="인쇄하기">
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.is_notice && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                    공지사항
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                <Building2 className="w-3 h-3" />
                                {post.company_name}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <span className="font-mono">{new Date(post.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-zinc-400" />
                                <span>{post.view_count || 0}회 조회</span>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 min-h-[300px] prose prose-zinc max-w-none">
                        {post.content ? (
                            <div className="whitespace-pre-wrap leading-relaxed text-zinc-800">
                                {post.content}
                            </div>
                        ) : (
                            <div className="text-zinc-400 italic">내용이 없습니다.</div>
                        )}
                    </div>

                    {/* Files */}
                    {files.length > 0 && (
                        <div className="bg-zinc-50 border-t border-zinc-100 p-6">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                첨부파일
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {files.map(file => (
                                    <li key={file.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors shadow-sm group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">{file.file_name}</p>
                                                <p className="text-xs text-zinc-500">{file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'Unknown Size'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(file.file_url, file.file_name)}
                                            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                                            title="다운로드"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
