'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { handleError } from '@/lib/utils'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageContext'

interface UploadResult {
  success: number
  failed: number
  errors: string[]
}

export default function Import() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setPreview([])
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          setPreview(jsonData.slice(0, 5) as string[][])
        } catch (error) {
          handleError(error, '파일 읽기')
        }
      }
      reader.readAsArrayBuffer(selectedFile)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      ['업체명', '차종', '품번', '품명', '입고수량', '반출수량', '발주수량', '비고'],
      ['명진', '9BUB (M) (JPC)', 'GA29120A / 42752811', 'SIDE WINDOW DEF LH', 100, 50, 100, '샘플 데이터'],
      ['명진', '9BUB (M) (JPC)', 'GA29150A / 42752812', 'SIDE WINDOW DEF RH', 120, 60, 120, '샘플 데이터'],
      ['선경내셔날', 'Q261', 'YA20970C', 'R/R BEZE', 50, 20, 50, '샘플 데이터']
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '재고데이터')
    XLSX.writeFile(wb, '재고데이터_템플릿.xlsx')
  }

  const handleUpload = async () => {
    if (!file) return

    const currentMonth = new Date().toISOString().slice(0, 7)
    const confirmDelete = confirm(`${currentMonth}월의 기존 데이터를 모두 삭제하고 새로 업로드하시겠습니까?`)
    if (!confirmDelete) return

    setUploading(true)
    setResult(null)

    try {
      const { error: deleteError } = await supabase.from('monthly_data').delete().eq('year_month', currentMonth)
      if (deleteError) handleError(deleteError, '기존 데이터 삭제')

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          let successCount = 0
          let failedCount = 0
          const errors: string[] = []

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as Record<string, string | number>
            try {
              if (!row['업체명'] || !row['차종'] || !row['품번']) {
                errors.push(`행 ${i + 2}: 필수 필드가 누락되었습니다 (업체명, 차종, 품번)`)
                failedCount++
                continue
              }

              const { data: existingOrder } = await supabase
                .from('order_register')
                .select('id')
                .eq('company', row['업체명'])
                .eq('chajong', row['차종'])
                .eq('pumbeon', row['품번'])
                .single()

              let orderId: number

              if (existingOrder) {
                orderId = existingOrder.id
                await supabase.from('order_register').update({ pm: String(row['품명'] || ''), remark: String(row['비고'] || '') }).eq('id', orderId)
              } else {
                const { data: newOrder, error: insertError } = await supabase
                  .from('order_register')
                  .insert({
                    company: String(row['업체명']),
                    chajong: String(row['차종']),
                    pumbeon: String(row['품번']),
                    pm: String(row['품명'] || ''),
                    in_qty: 0,
                    out_qty: 0,
                    order_qty: 0,
                    remark: String(row['비고'] || '')
                  })
                  .select('id')
                  .single()

                if (insertError) throw insertError
                orderId = newOrder.id
              }

              await supabase.from('monthly_data').delete().eq('year_month', currentMonth).eq('order_id', orderId)

              const { error: monthlyError } = await supabase.from('monthly_data').insert({
                year_month: currentMonth,
                order_id: orderId,
                in_qty: parseInt(String(row['입고수량'])) || 0,
                out_qty: parseInt(String(row['반출수량'])) || 0,
                stock_qty: (parseInt(String(row['입고수량'])) || 0) - (parseInt(String(row['반출수량'])) || 0),
                order_qty: parseInt(String(row['발주수량'])) || 0
              })

              if (monthlyError) throw monthlyError
              successCount++
            } catch (error) {
              errors.push(`행 ${i + 2}: ${(error as Error).message}`)
              failedCount++
            }
          }

          setResult({ success: successCount, failed: failedCount, errors })
        } catch (error) {
          setResult({ success: 0, failed: 1, errors: [`파일 처리 오류: ${(error as Error).message}`] })
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      setResult({ success: 0, failed: 1, errors: [`업로드 오류: ${(error as Error).message}`] })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/inventory" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.import.back}
          </Link>
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t.import.title}</h1>
                <p className="text-zinc-500 mt-2">{t.import.description}</p>
             </div>
             <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm font-medium transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                {t.import.downloadTemplate}
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {/* Upload Zone */}
           <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
              <div className="border-2 border-dashed border-zinc-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-zinc-400 transition-colors bg-zinc-50/50">
                 <div className="p-4 bg-zinc-100 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-zinc-400" />
                 </div>
                 <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-zinc-900 font-semibold hover:underline">{t.import.clickUpload}</span>
                    <span className="text-zinc-500"> {t.import.dragDrop}</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                 </label>
                 <p className="text-xs text-zinc-400 mt-2">{t.import.fileType}</p>
              </div>

              {file && (
                 <div className="mt-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <FileSpreadsheet className="w-8 h-8 text-green-600" />
                       <div>
                          <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                       </div>
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 text-sm font-medium transition-all"
                    >
                      {uploading ? t.import.uploading : t.import.startImport}
                    </button>
                 </div>
              )}
           </div>

           {/* Preview Section */}
           {preview.length > 0 && (
             <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                   <h3 className="font-semibold text-zinc-900">{t.import.preview}</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                         <tr>
                            {preview[0]?.map((header: any, i: number) => (
                               <th key={i} className="px-6 py-3 font-medium">{header}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                         {preview.slice(1).map((row, i) => (
                            <tr key={i} className="hover:bg-zinc-50">
                               {row.map((cell: any, j: number) => (
                                  <td key={j} className="px-6 py-3 text-zinc-700">{cell}</td>
                               ))}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {/* Results Section */}
           {result && (
              <div className={`rounded-xl border p-6 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                 <div className="flex items-start gap-4">
                    {result.failed === 0 ? <CheckCircle className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
                    <div>
                       <h3 className={`font-semibold ${result.failed === 0 ? 'text-green-900' : 'text-amber-900'}`}>
                          {t.import.complete}
                       </h3>
                       <p className={`text-sm mt-1 ${result.failed === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                          {result.failed === 0 
                            ? t.import.successMsg.replace('{count}', result.success.toString()) 
                            : t.import.failMsg.replace('{count}', result.failed.toString())}
                       </p>
                       {result.errors.length > 0 && (
                          <div className="mt-4 p-4 bg-white/50 rounded-lg">
                             <h4 className="text-sm font-semibold mb-2">{t.import.errorTitle}</h4>
                             <ul className="text-sm space-y-1 text-red-600 list-disc list-inside">
                                {result.errors.map((err, i) => (
                                   <li key={i}>{err}</li>
                                ))}
                             </ul>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
