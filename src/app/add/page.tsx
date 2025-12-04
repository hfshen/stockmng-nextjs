'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Plus } from 'lucide-react'
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
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/inventory" 
            className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">New Inbound Item</h1>
          <p className="text-zinc-500 mt-2">Register new stock items or update existing inventory counts.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-medium text-zinc-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-zinc-900 rounded-full"></div>
                Item Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="add-company" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="add-company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">Select Supplier</option>
                      {companies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="add-chajong" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-chajong"
                    type="text"
                    value={formData.chajong}
                    onChange={(e) => setFormData(prev => ({ ...prev, chajong: e.target.value }))}
                    required
                    placeholder="e.g. 9BUB"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="add-pumbeon" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Part Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-pumbeon"
                    type="text"
                    value={formData.pumbeon}
                    onChange={(e) => setFormData(prev => ({ ...prev, pumbeon: e.target.value }))}
                    required
                    placeholder="e.g. GA29120A"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="add-pm" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Part Name
                  </label>
                  <input
                    id="add-pm"
                    type="text"
                    value={formData.pm}
                    onChange={(e) => setFormData(prev => ({ ...prev, pm: e.target.value }))}
                    placeholder="e.g. SIDE WINDOW DEF"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-100"></div>

            {/* Quantity Section */}
            <div>
              <h3 className="text-lg font-medium text-zinc-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-zinc-900 rounded-full"></div>
                Stock Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="add-in-date" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Inbound Date
                  </label>
                  <input
                    id="add-in-date"
                    type="date"
                    value={formData.in_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="add-in-qty" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Inbound Quantity
                  </label>
                  <input
                    id="add-in-qty"
                    type="number"
                    value={formData.in_qty === 0 ? '' : formData.in_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_qty: parseInt(e.target.value) || 0 }))}
                    onFocus={(e) => e.target.value === '0' && e.target.select()}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-right font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="add-order-qty" className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Order Quantity
                  </label>
                  <input
                    id="add-order-qty"
                    type="number"
                    value={formData.order_qty === 0 ? '' : formData.order_qty}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_qty: parseInt(e.target.value) || 0 }))}
                    onFocus={(e) => e.target.value === '0' && e.target.select()}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-right font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="add-remark" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Notes
              </label>
              <textarea
                id="add-remark"
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/inventory"
                className="px-6 py-2.5 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 font-medium text-sm transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Register Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
