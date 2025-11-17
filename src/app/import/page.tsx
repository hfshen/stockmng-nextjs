'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

interface UploadResult {
  success: number
  failed: number
  errors: string[]
}

export default function Import() {
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
      
      // 파일 미리보기
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // 첫 5행만 미리보기
          setPreview(jsonData.slice(0, 5) as string[][])
        } catch (error) {
          console.error('파일 읽기 오류:', error)
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

    // 해당 월의 기존 데이터 삭제 확인
    const currentMonth = new Date().toISOString().slice(0, 7)
    const confirmDelete = confirm(
      `${currentMonth}월의 기존 데이터를 모두 삭제하고 새로 업로드하시겠습니까?`
    )
    
    if (!confirmDelete) return

    setUploading(true)
    setResult(null)

    try {
      // 해당 월의 기존 monthly_data 삭제
      const { error: deleteError } = await supabase
        .from('monthly_data')
        .delete()
        .eq('year_month', currentMonth)

      if (deleteError) {
        console.error('기존 데이터 삭제 오류:', deleteError)
        // 삭제 오류가 있어도 계속 진행
      }

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
              // 필수 필드 검증
              if (!row['업체명'] || !row['차종'] || !row['품번']) {
                errors.push(`행 ${i + 2}: 필수 필드가 누락되었습니다 (업체명, 차종, 품번)`)
                failedCount++
                continue
              }

              // 기존 레코드 확인
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
                // 기존 레코드 업데이트 (기본 정보만 업데이트)
                await supabase
                  .from('order_register')
                  .update({
                    pm: String(row['품명'] || ''),
                    remark: String(row['비고'] || '')
                  })
                  .eq('id', orderId)
              } else {
                // 새 레코드 생성
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

              // 해당 월의 기존 monthly_data 삭제 (중복 방지)
              await supabase
                .from('monthly_data')
                .delete()
                .eq('year_month', currentMonth)
                .eq('order_id', orderId)

              // 월별 데이터 삽입 (새로 생성)
              const { error: monthlyError } = await supabase
                .from('monthly_data')
                .insert({
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

          setResult({
            success: successCount,
            failed: failedCount,
            errors
          })
        } catch (error) {
          setResult({
            success: 0,
            failed: 1,
            errors: [`파일 처리 오류: ${(error as Error).message}`]
          })
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [`업로드 오류: ${(error as Error).message}`]
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 mr-2 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">데이터 가져오기</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Excel 파일 업로드</h2>
            <p className="text-gray-600">
              Excel 파일을 업로드하여 재고 데이터를 일괄 등록할 수 있습니다.
            </p>
          </div>

          {/* 템플릿 다운로드 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Excel 템플릿 다운로드</span>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                템플릿 다운로드
              </button>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Excel 파일 선택
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              aria-label="Excel 파일 선택"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* 파일 미리보기 */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">파일 미리보기 (첫 5행)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header: string | number, index: number) => (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1).map((row: (string | number)[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: string | number, cellIndex: number) => (
                          <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 업로드 버튼 */}
          <div className="mb-6">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  데이터 업로드
                </>
              )}
            </button>
          </div>

          {/* 결과 표시 */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center mb-2">
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  업로드 완료
                </h3>
              </div>
              <div className="text-sm text-gray-700">
                <p>성공: {result.success}개</p>
                <p>실패: {result.failed}개</p>
              </div>
              
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">오류 목록:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
