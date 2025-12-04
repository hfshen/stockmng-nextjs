'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Package, AlertTriangle, Warehouse, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/utils'

interface DashboardStats {
  totalItems: number
  totalStock: number
  lowStockItems: number
  outOfStockItems: number
  monthlyIncoming: number
  monthlyOutgoing: number
  companyStats: Array<{
    company: string
    totalStock: number
    itemCount: number
    totalIncoming: number
    totalOutgoing: number
    totalOrderQty: number
  }>
  monthlyTrend: Array<{
    month: string
    incoming: number
    outgoing: number
    stock: number
  }>
  categoryStats: Array<{
    category: string
    value: number
  }>
  companyDetails: Array<{
    company: string
    items: Array<{
      chajong: string
      pumbeon: string
      pm: string
      order_qty: number
      in_qty: number
      out_qty: number
      stock_qty: number
    }>
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // 기본 재고 데이터 조회
      const { data: orderData, error: orderError } = await supabase
        .from('order_register')
        .select('*')

      if (orderError) throw orderError

      // 월별 데이터 조회
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('year_month', selectedMonth)

      if (monthlyError) throw monthlyError

      // 입고 이력 조회 (최근 6개월)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: inRegisterData, error: inRegisterError } = await supabase
        .from('in_register')
        .select('*')
        .gte('in_date', sixMonthsAgo.toISOString().slice(0, 10))

      if (inRegisterError) throw inRegisterError

      // 통계 계산
      const totalItems = orderData?.length ?? 0
      let totalStock = 0
      let lowStockItems = 0
      let outOfStockItems = 0
      let monthlyIncoming = 0
      let monthlyOutgoing = 0

      const companyMap = new Map<string, { 
        totalStock: number
        itemCount: number
        totalIncoming: number
        totalOutgoing: number
        totalOrderQty: number
        items: Array<{
          chajong: string
          pumbeon: string
          pm: string
          order_qty: number
          in_qty: number
          out_qty: number
          stock_qty: number
        }>
      }>()
      const monthlyTrendMap = new Map<string, { incoming: number; outgoing: number; stock: number }>()

      orderData?.forEach(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        const stock = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        const incoming = monthly?.in_qty ?? order.in_qty
        const outgoing = monthly?.out_qty ?? order.out_qty
        const orderQty = monthly?.order_qty ?? order.order_qty

        totalStock += stock
        monthlyIncoming += incoming
        monthlyOutgoing += outgoing

        if (stock <= 0) outOfStockItems++
        else if (stock <= 10) lowStockItems++

        // 업체별 통계
        const company = companyMap.get(order.company) || { 
          totalStock: 0, 
          itemCount: 0,
          totalIncoming: 0,
          totalOutgoing: 0,
          totalOrderQty: 0,
          items: []
        }
        companyMap.set(order.company, {
          totalStock: company.totalStock + stock,
          itemCount: company.itemCount + 1,
          totalIncoming: company.totalIncoming + incoming,
          totalOutgoing: company.totalOutgoing + outgoing,
          totalOrderQty: company.totalOrderQty + orderQty,
          items: [...company.items, {
            chajong: order.chajong,
            pumbeon: order.pumbeon,
            pm: order.pm,
            order_qty: orderQty,
            in_qty: incoming,
            out_qty: outgoing,
            stock_qty: stock
          }]
        })
      })

      // 월별 트렌드 계산
      inRegisterData?.forEach(record => {
        const month = record.in_date.slice(0, 7)
        const trend = monthlyTrendMap.get(month) || { incoming: 0, outgoing: 0, stock: 0 }
        monthlyTrendMap.set(month, {
          ...trend,
          incoming: trend.incoming + record.in_count
        })
      })

      const companyStats = Array.from(companyMap.entries()).map(([company, data]) => ({
        company,
        totalStock: data.totalStock,
        itemCount: data.itemCount,
        totalIncoming: data.totalIncoming,
        totalOutgoing: data.totalOutgoing,
        totalOrderQty: data.totalOrderQty
      }))

      const companyDetails = Array.from(companyMap.entries()).map(([company, data]) => ({
        company,
        items: data.items
      }))

      const monthlyTrend = Array.from(monthlyTrendMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // 카테고리별 통계 (차종 기준)
      const categoryMap = new Map<string, number>()
      orderData?.forEach(order => {
        const category = order.chajong.split(' ')[0] // 첫 번째 단어를 카테고리로 사용
        const current = categoryMap.get(category) || 0
        categoryMap.set(category, current + 1)
      })

      const categoryStats = Array.from(categoryMap.entries()).map(([category, value]) => ({
        category,
        value
      }))

      setStats({
        totalItems,
        totalStock,
        lowStockItems,
        outOfStockItems,
        monthlyIncoming,
        monthlyOutgoing,
        companyStats,
        monthlyTrend,
        categoryStats,
        companyDetails
      })
    } catch (error) {
      handleError(error, '대시보드 데이터 로드')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    loadDashboardStats()
  }, [loadDashboardStats])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mr-3">
                <Warehouse className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <label htmlFor="dashboard-month" className="sr-only">월 선택</label>
              <input
                id="dashboard-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="월 선택"
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm transition-all"
              />
            </div>
          </div>
        </div>
        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 품목 수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 재고량</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">부족 재고</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">재고 없음</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 월별 입출고 현황 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 입출고 현황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="incoming" stroke="#8884d8" name="입고" />
                <Line type="monotone" dataKey="outgoing" stroke="#82ca9d" name="반출" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">업체별 재고 현황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.companyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalStock" fill="#8884d8" name="총 재고량" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 업체별 상세 현황 */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">업체별 상세 현황</h3>
            <div className="space-y-6">
              {stats.companyDetails.map((companyDetail) => {
                const companyStat = stats.companyStats.find(c => c.company === companyDetail.company)
                return (
                  <div key={companyDetail.company} className="border rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">{companyDetail.company}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-600">월발주수량</p>
                        <p className="text-lg font-bold text-blue-900">{companyStat?.totalOrderQty.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-gray-600">입고</p>
                        <p className="text-lg font-bold text-green-900">{companyStat?.totalIncoming.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-xs text-gray-600">반출</p>
                        <p className="text-lg font-bold text-red-900">{companyStat?.totalOutgoing.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600">재고현황</p>
                        <p className="text-lg font-bold text-purple-900">{companyStat?.totalStock.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">차종</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">품번</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">품명</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">월발주</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">입고</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">반출</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">재고</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {companyDetail.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{item.chajong}</td>
                              <td className="px-3 py-2 text-gray-900">{item.pumbeon}</td>
                              <td className="px-3 py-2 text-gray-900">{item.pm}</td>
                              <td className="px-3 py-2 text-right text-gray-900">{item.order_qty.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-gray-900">{item.in_qty.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-gray-900">{item.out_qty.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-gray-900">{item.stock_qty.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 카테고리별 분포 및 상세 통계 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.category} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 달 요약</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">총 입고량</span>
                <span className="text-green-900 font-bold">{stats.monthlyIncoming.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-800 font-medium">총 반출량</span>
                <span className="text-red-900 font-bold">{stats.monthlyOutgoing.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-800 font-medium">순 증가량</span>
                <span className="text-blue-900 font-bold">
                  {(stats.monthlyIncoming - stats.monthlyOutgoing).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-800 font-medium">재고 회전율</span>
                <span className="text-yellow-900 font-bold">
                  {stats.totalStock > 0 ? ((stats.monthlyOutgoing / stats.totalStock) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
