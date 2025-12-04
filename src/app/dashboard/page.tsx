'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Package, AlertTriangle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/utils'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageContext'

interface DashboardStats {
  totalItems: number
  totalStock: number
  lowStockItems: number
  outOfStockItems: number
  monthlyIncoming: number
  monthlyOutgoing: number
  companyStats: any[]
  monthlyTrend: any[]
  categoryStats: any[]
  companyDetails: any[]
}

const StatCard = ({ title, value, icon: Icon, colorClass, subValue }: any) => (
  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between h-32">
     <div className="flex items-start justify-between">
        <div>
           <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
           <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
           <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
     </div>
     {subValue && <p className="text-xs text-zinc-400 mt-auto">{subValue}</p>}
  </div>
)

export default function Dashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const COLORS = ['#18181b', '#52525b', '#a1a1aa', '#e4e4e7']

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: orderData } = await supabase.from('order_register').select('*')
      const { data: monthlyData } = await supabase.from('monthly_data').select('*').eq('year_month', selectedMonth)
      
      // Calculate Stats
      const totalItems = orderData?.length ?? 0
      let totalStock = 0
      let lowStockItems = 0
      let outOfStockItems = 0
      let monthlyIncoming = 0
      let monthlyOutgoing = 0

      orderData?.forEach(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        const stock = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        totalStock += stock
        monthlyIncoming += monthly?.in_qty ?? order.in_qty
        monthlyOutgoing += monthly?.out_qty ?? order.out_qty

        if (stock <= 0) outOfStockItems++
        else if (stock <= 10) lowStockItems++
      })

      // Mock Trend Data for Visualization (Replace with real logic if needed)
      const monthlyTrend = [
         { name: 'Jan', incoming: 400, outgoing: 240 },
         { name: 'Feb', incoming: 300, outgoing: 139 },
         { name: 'Mar', incoming: 200, outgoing: 980 },
         { name: 'Apr', incoming: 278, outgoing: 390 },
         { name: 'May', incoming: 189, outgoing: 480 },
      ]

      // Category Data
      const categoryMap = new Map<string, number>()
      orderData?.forEach(order => {
        const cat = order.chajong.split(' ')[0]
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
      })
      const categoryStats = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))

      setStats({
        totalItems,
        totalStock,
        lowStockItems,
        outOfStockItems,
        monthlyIncoming,
        monthlyOutgoing,
        companyStats: [],
        monthlyTrend,
        categoryStats,
        companyDetails: []
      })
    } catch (error) {
      handleError(error, 'Dashboard Load')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => { loadDashboardStats() }, [loadDashboardStats])

  if (loading || !stats) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-400">Loading dashboard...</div>

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
           <div>
              <Link href="/inventory" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t.add.back}
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t.dashboard.title}</h1>
              <p className="text-zinc-500 mt-2">{t.dashboard.description}</p>
           </div>
           <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              aria-label="Select Month"
              className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
           />
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
           <StatCard title={t.dashboard.totalItems} value={stats.totalItems} icon={Package} colorClass="bg-blue-500" subValue={t.dashboard.subValues.activeSku} />
           <StatCard title={t.dashboard.totalStock} value={stats.totalStock.toLocaleString()} icon={TrendingUp} colorClass="bg-green-500" subValue={t.dashboard.subValues.onHand} />
           <StatCard title={t.dashboard.lowStock} value={stats.lowStockItems} icon={AlertTriangle} colorClass="bg-amber-500" subValue={t.dashboard.subValues.reorder} />
           <StatCard title={t.dashboard.outOfStock} value={stats.outOfStockItems} icon={TrendingDown} colorClass="bg-red-500" subValue={t.dashboard.subValues.critical} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
           {/* Chart 1: Trend */}
           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-6">{t.dashboard.monthlyFlow}</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyTrend}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} />
                       <Tooltip cursor={{fill: '#f4f4f5'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                       <Bar dataKey="incoming" fill="#18181b" radius={[4, 4, 0, 0]} name={t.dashboard.incoming} />
                       <Bar dataKey="outgoing" fill="#a1a1aa" radius={[4, 4, 0, 0]} name={t.dashboard.outgoing} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Chart 2: Distribution */}
           <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-6">{t.dashboard.categoryDist}</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                          data={stats.categoryStats} 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="value"
                        >
                          {stats.categoryStats.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="flex justify-center gap-4 mt-4">
                    {stats.categoryStats.slice(0, 3).map((entry, index) => (
                       <div key={index} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span>{entry.name}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
