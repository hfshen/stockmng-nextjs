'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Download, Warehouse } from 'lucide-react'
import { supabase, InventoryItem } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [data, setData] = useState<InventoryItem[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    company: '',
    chajong: '',
    pumbeon: ''
  })

  // 현재 월 문자열 생성
  const getCurrentMonth = () => {
    return new Date().toISOString().slice(0, 7)
  }

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 기본 재고 데이터 조회
      const { data: orderData, error: orderError } = await supabase
        .from('order_register')
        .select('*')
        .order('company')

      if (orderError) throw orderError

      // 월별 데이터 조회
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('year_month', filters.month)

      if (monthlyError) throw monthlyError

      // 데이터 결합
      const inventoryData: InventoryItem[] = orderData?.map(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        
        const in_qty = monthly?.in_qty ?? order.in_qty
        const stock_qty = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        const order_qty = monthly?.order_qty ?? order.order_qty
        const out_qty = monthly?.out_qty ?? order.out_qty
        
        const in_shortage = order_qty - in_qty + out_qty
        let display_in_shortage = '0'
        if (in_shortage < 0) {
          display_in_shortage = `+${Math.abs(in_shortage)}`
        } else if (in_shortage > 0) {
          display_in_shortage = `-${in_shortage}`
        }

        return {
          id: order.id,
          company: order.company,
          chajong: order.chajong,
          pumbeon: order.pumbeon,
          pm: order.pm,
          in_qty,
          stock_qty,
          in_shortage: display_in_shortage,
          order_qty,
          out_qty,
          remark: order.remark
        }
      }) ?? []

      // 필터링
      const filteredData = inventoryData.filter(item => {
        if (filters.company && !item.company.includes(filters.company)) return false
        if (filters.chajong && !item.chajong.includes(filters.chajong)) return false
        if (filters.pumbeon && !item.pumbeon.includes(filters.pumbeon)) return false
        return true
      })

      setData(filteredData)
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      // 폴백 데이터
      setData([
        {
          id: 1,
          company: '명진',
          chajong: '9BUB (M) (JPC)',
          pumbeon: 'GA29120A / 42752811',
          pm: 'SIDE WINDOW DEF LH',
          in_qty: 100,
          stock_qty: 50,
          in_shortage: '0',
          order_qty: 100,
          out_qty: 50,
          remark: '초기 재고'
        },
        {
          id: 2,
          company: '명진',
          chajong: '9BUB (M) (JPC)',
          pumbeon: 'GA29150A / 42752812',
          pm: 'SIDE WINDOW DEF RH',
          in_qty: 120,
          stock_qty: 60,
          in_shortage: '0',
          order_qty: 120,
          out_qty: 60,
          remark: '초기 재고'
        },
        {
          id: 3,
          company: '선경내셔날',
          chajong: 'Q261',
          pumbeon: 'YA20970C',
          pm: 'R/R BEZE',
          in_qty: 50,
          stock_qty: 30,
          in_shortage: '0',
          order_qty: 50,
          out_qty: 20,
          remark: '샘플 데이터'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

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

  // 월별 목록 로드
  const loadMonths = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_data')
        .select('year_month')
        .order('year_month', { ascending: false })

      if (error) throw error

      const uniqueMonths = [...new Set(data?.map(item => item.year_month) ?? [])]
      setMonths(uniqueMonths.length > 0 ? uniqueMonths : [getCurrentMonth()])
    } catch (error) {
      console.error('월별 목록 로드 오류:', error)
      setMonths([getCurrentMonth()])
    }
  }

  // CSV 내보내기
  const exportCSV = () => {
    const headers = [
      '업체명', '차종', '품번', '품명',
      '입고', '재고', '미입고/과입고', '발주수량', '반출', '비고'
    ]

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.company,
        item.chajong,
        item.pumbeon,
        item.pm,
        item.in_qty,
        item.stock_qty,
        item.in_shortage,
        item.order_qty,
        item.out_qty,
        item.remark
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'inventory_data.csv'
    link.click()
  }

  useEffect(() => {
    loadData()
    loadCompanies()
    loadMonths()
  }, [filters])

  const getShortageColor = (shortage: string) => {
    if (shortage.startsWith('+')) return 'text-green-600'
    if (shortage.startsWith('-')) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Search className="h-6 w-6 mr-2" />
                재고 현황
              </h2>
              <div className="flex items-center space-x-4">
                <Link
                  href="/add"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  입고등록
                </Link>
                <button
                  onClick={exportCSV}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-1" />
                  내보내기
                </button>
              </div>
            </div>

            {/* 검색 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">월별</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업체명</label>
                <select
                  value={filters.company}
                  onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차종</label>
                <input
                  type="text"
                  value={filters.chajong}
                  onChange={(e) => setFilters(prev => ({ ...prev, chajong: e.target.value }))}
                  placeholder="차종 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">품번</label>
                <input
                  type="text"
                  value={filters.pumbeon}
                  onChange={(e) => setFilters(prev => ({ ...prev, pumbeon: e.target.value }))}
                  placeholder="품번 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadData}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Search className="h-4 w-4 mr-1" />
                  조회
                </button>
              </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차종</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품번</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품명</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">입고</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">재고</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">미입고/과입고</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">발주수량</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">반출</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                        데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.company}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.chajong}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pumbeon}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pm}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.in_qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.stock_qty}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getShortageColor(item.in_shortage)}`}>
                          {item.in_shortage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.order_qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.out_qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remark}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}