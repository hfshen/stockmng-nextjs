'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, FileText, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { handleError } from '@/lib/utils'
import Link from 'next/link'

export default function BoardWrite() {
    const router = useRouter()
    const { showToast } = useToast()

    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [isNotice, setIsNotice] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        try {
            // 1. Get current user's company info
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('로그인이 필요합니다.')
                router.push('/login')
                return
            }

            // Fetch company name from company_accounts table
            const { data: companyData, error: companyError } = await supabase
                .from('company_accounts')
                .select('company_name')
                .eq('auth_user_id', user.id)
                .single()

            if (companyError || !companyData) {
                throw new Error('사용자의 업체 정보를 찾을 수 없습니다.')
            }

            const companyName = companyData.company_name
            const author = user.email?.split('@')[0] || 'Unknown' // Or use a name field if added

            // 2. Insert Post
            const { data: postData, error: postError } = await supabase
                .from('board_posts')
                .insert({
                    company_name: companyName,
                    title,
                    content,
                    author,
                    is_notice: isNotice
                })
                .select()
                .single()

            if (postError) throw postError

            // 3. Upload File if exists
            if (file && postData) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${postData.id}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${companyName}/${postData.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('bulletin-files')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                // 4. Insert File Record
                // Public URL 생성
                const { data: { publicUrl } } = supabase.storage
                    .from('bulletin-files')
                    .getPublicUrl(filePath)

                const { error: fileRecordError } = await supabase
                    .from('board_files')
                    .insert({
                        post_id: postData.id,
                        file_name: file.name,
                        file_url: publicUrl, // or just filePath if using signed urls
                        file_size: file.size
                    })

                if (fileRecordError) throw fileRecordError
            }

            showToast('게시글이 등록되었습니다.', 'success')
            router.push('/board')

        } catch (error) {
            handleError(error, '게시글 등록')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <Link href="/board" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        목록으로 돌아가기
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">글쓰기</h1>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-300"
                                required
                            />
                        </div>

                        {/* Notice Checkbox (Admin Only - Logic needed) */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="notice"
                                checked={isNotice}
                                onChange={(e) => setIsNotice(e.target.checked)}
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="notice" className="text-sm text-zinc-700 select-none">공지사항으로 등록</label>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="내용을 입력하세요"
                                rows={10}
                                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-300 resize-none"
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">첨부파일</label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-200 border-dashed rounded-lg hover:border-zinc-400 transition-colors ${file ? 'bg-zinc-50' : ''}`}>
                                <div className="space-y-1 text-center">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-2 text-sm text-zinc-900">
                                            <FileText className="w-6 h-6 text-zinc-500" />
                                            <span className="font-medium">{file.name}</span>
                                            <span className="text-zinc-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                            <button
                                                type="button"
                                                onClick={() => setFile(null)}
                                                className="p-1 hover:bg-zinc-200 rounded-full text-zinc-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-zinc-400" />
                                            <div className="flex text-sm text-zinc-600 justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                    <span>파일 업로드</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                                </label>
                                                <p className="pl-1">또는 드래그 앤 드롭</p>
                                            </div>
                                            <p className="text-xs text-zinc-500">
                                                엑셀(XLSX), 이미지(PNG, JPG) 등 최대 10MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Link href="/board">
                                <button type="button" className="px-6 py-2.5 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium text-sm transition-colors">
                                    취소
                                </button>
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-6 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium text-sm transition-colors"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 등록 중...</> : '등록하기'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
