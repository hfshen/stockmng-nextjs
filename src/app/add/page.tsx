'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AddItem() {
  const router = useRouter()
  const [companies, setCompanies] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: '',
    chajong: '',
    pumbeon: '',
    pm: '',
    in_date: new Date().toISOString().slice(0, 10),
    in_qty: 0,
    order_qty: 0,
    remark: ''
  })

  // 업체 목록 로드
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('order_register')
        .select('company')
        .not('company', 'is', null)
        .not('company', 'eq', '')

      if (error) throw error

      const uniqueCompanies = [...new Set(data?.map(item => item.company) ?? [])]
      setCompanies(uniqueCompanies.length > 0 ? uniqueCompanies : ['명진', '선경내셔날'])
    } catch (error) {
      console.error('업체 목록 로드 오류:', error)
      setCompanies(['명진', '선경내셔날'])
    }
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. order_register에서 기존 레코드 찾기 또는 생성
      const { data: existingOrder, error: findError } = await supabase
        .from('order_register')
        .select('id')
        .eq('company', formData.company)
        .eq('chajong', formData.chajong)
        .eq('pumbeon', formData.pumbeon)
        .single()

      let orderId: number

      if (findError && findError.code !== 'PGRST116') {
        throw findError
      }

      if (existingOrder) {
        orderId = existingOrder.id
      } else {
        // 새 레코드 생성
        const { data: newOrder, error: insertError } = await supabase
          .from('order_register')
          .insert({
            company: formData.company,
            chajong: formData.chajong,
            pumbeon: formData.pumbeon,
            pm: formData.pm,
            remark: formData.remark
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        orderId = newOrder.id
      }

      // 2. 입고 이력 추가
      const { error: inRegisterError } = await supabase
        .from('in_register')
        .insert({
          order_id: orderId,
          in_date: formData.in_date,
          in_count: formData.in_qty
        })

      if (inRegisterError) throw inRegisterError

      // 3. 월별 데이터 업데이트
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { error: monthlyError } = await supabase
        .from('monthly_data')
        .upsert({
          year_month: currentMonth,
          order_id: orderId,
          in_qty: formData.in_qty,
          out_qty: 0,
          stock_qty: formData.in_qty,
          order_qty: formData.order_qty
        })

      if (monthlyError) throw monthlyError

      alert('입고등록이 완료되었습니다.')
      router.push('/')
    } catch (error) {
      console.error('입고등록 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Save className="h-6 w-6 mr-2" />
              입고등록
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 *
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">업체를 선택하세요</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    차종 *
                  </label>
                  <input
                    type="text"
                    value={formData.chajong}
                    onChange={(e) => setFormData(prev => ({ ...prev, chajong: e.target.value }))}
                    required
                    placeholder="차종을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    품번 *
                  </label>
                  <input
                    type="text"
                    value={formData.pumbeon}
                    onChange={(e) => setFormData(prev => ({ ...prev, pumbeon: e.target.value }))}
                    required
                    placeholder="품번을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    품명
                  </label>
                  <input
                    type="text"
                    value={formData.pm}
                    onChange={(e) => setFormData(prev => ({ ...prev, pm: e.target.value }))}
                    placeholder="품명을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입고일자
                  </label>
                  <input
                    type="date"
                    value={formData.in_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입고수량
                  </label>
                  <input
                    type="number"
                    value={formData.in_qty === 0 ? '' : formData.in_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_qty: parseInt(e.target.value) || 0 }))}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '') {
                        e.target.select()
                      }
                    }}
                    placeholder="입고수량을 입력하세요"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발주수량
                  </label>
                  <input
                    type="number"
                    value={formData.order_qty === 0 ? '' : formData.order_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_qty: parseInt(e.target.value) || 0 }))}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '') {
                        e.target.select()
                      }
                    }}
                    placeholder="발주수량을 입력하세요"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비고
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  rows={3}
                  placeholder="비고를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/"
                  className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
