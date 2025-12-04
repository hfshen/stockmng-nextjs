'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { handleError } from '@/lib/utils'

export default function AddItem() {
  const router = useRouter()
  const { showToast } = useToast()
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
      handleError(error, '업체 목록 로드')
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

      showToast('입고등록이 완료되었습니다.', 'success')
      router.push('/inventory')
    } catch (error) {
      const message = handleError(error, '입고등록')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-8">
            <div className="flex items-center mb-8">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mr-3">
                <Save className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">입고등록</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="add-company" className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 *
                  </label>
                  <select
                    id="add-company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    required
                    aria-label="업체명 선택"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
                  >
                    <option value="">업체를 선택하세요</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="add-chajong" className="block text-sm font-medium text-gray-700 mb-1">
                    차종 *
                  </label>
                  <input
                    id="add-chajong"
                    type="text"
                    value={formData.chajong}
                    onChange={(e) => setFormData(prev => ({ ...prev, chajong: e.target.value }))}
                    required
                    placeholder="차종을 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="add-pumbeon" className="block text-sm font-medium text-gray-700 mb-1">
                    품번 *
                  </label>
                  <input
                    id="add-pumbeon"
                    type="text"
                    value={formData.pumbeon}
                    onChange={(e) => setFormData(prev => ({ ...prev, pumbeon: e.target.value }))}
                    required
                    placeholder="품번을 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="add-pm" className="block text-sm font-medium text-gray-700 mb-1">
                    품명
                  </label>
                  <input
                    id="add-pm"
                    type="text"
                    value={formData.pm}
                    onChange={(e) => setFormData(prev => ({ ...prev, pm: e.target.value }))}
                    placeholder="품명을 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="add-in-date" className="block text-sm font-medium text-gray-700 mb-1">
                    입고일자
                  </label>
                  <input
                    id="add-in-date"
                    type="date"
                    value={formData.in_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
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

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-8">
                <Link
                  href="/inventory"
                  className="flex items-center justify-center px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save className="h-4 w-4 mr-1.5" />
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
