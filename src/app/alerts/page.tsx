'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, CheckCircle, XCircle, Package, Edit, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
import { supabase, InventoryItem, EditHistory } from '@/lib/supabase'
import { handleError } from '@/lib/utils'
import Link from 'next/link'

interface Alert {
  id: string
  type: 'low_stock' | 'out_of_stock' | 'high_demand' | 'expiring_soon' | 'edit_history'
  title: string
  message: string
  item?: InventoryItem
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  editHistory?: EditHistory
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const { data: orderData, error: orderError } = await supabase.from('order_register').select('*')
      if (orderError) throw orderError

      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyData, error: monthlyError } = await supabase.from('monthly_data').select('*').eq('year_month', currentMonth)
      if (monthlyError) throw monthlyError

      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)
      const { data: editHistoryData } = await supabase.from('edit_history').select('*').gte('created_at', oneDayAgo.toISOString()).order('created_at', { ascending: false })

      const newAlerts: Alert[] = []

      // History Alerts
      if (editHistoryData) {
        for (const history of editHistoryData) {
          const order = orderData?.find(o => o.id === history.order_id)
          if (order) {
            newAlerts.push({
              id: `edit_history_${history.id}`,
              type: 'edit_history',
              title: 'Stock Updated',
              message: `${order.company} - ${order.pumbeon} information updated.`,
              priority: 'low',
              createdAt: history.created_at,
              editHistory: history
            })
          }
        }
      }

      // Stock Alerts
      orderData?.forEach(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        const stock = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        const order_qty = monthly?.order_qty ?? order.order_qty
        
        const item = { ...order, stock_qty: stock, order_qty }

        if (stock <= 0) {
          newAlerts.push({
            id: `out_of_stock_${order.id}`,
            type: 'out_of_stock',
            title: 'Out of Stock',
            message: `${order.company} - ${order.pumbeon} is currently out of stock.`,
            item,
            priority: 'high',
            createdAt: new Date().toISOString()
          })
        } else if (stock <= 10) {
          newAlerts.push({
            id: `low_stock_${order.id}`,
            type: 'low_stock',
            title: 'Low Stock Warning',
            message: `${order.company} - ${order.pumbeon} has low stock (${stock}).`,
            item,
            priority: 'medium',
            createdAt: new Date().toISOString()
          })
        }
      })

      newAlerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      setAlerts(newAlerts)
    } catch (error) {
      handleError(error, '알림 로드')
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    setSelectedAlerts(prev => { const newSet = new Set(prev); newSet.delete(alertId); return newSet })
  }

  const toggleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) newSet.delete(alertId)
      else newSet.add(alertId)
      return newSet
    })
  }

  useEffect(() => { loadAlerts() }, [])

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))
  
  const getPriorityStyles = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-100 text-red-900'
      case 'medium': return 'bg-amber-50 border-amber-100 text-amber-900'
      case 'low': return 'bg-zinc-50 border-zinc-100 text-zinc-900'
      default: return 'bg-zinc-50 border-zinc-100'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/inventory" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Link>
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Alerts & Notifications</h1>
                <p className="text-zinc-500 mt-2">Manage stock alerts and system notifications.</p>
             </div>
             <div className="flex gap-2">
               {selectedAlerts.size > 0 && (
                 <button 
                  onClick={() => {
                     setDismissedAlerts(prev => new Set([...prev, ...selectedAlerts]));
                     setSelectedAlerts(new Set());
                  }}
                  className="flex items-center px-3 py-2 bg-white border border-zinc-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Dismiss Selected
                 </button>
               )}
               <button 
                onClick={loadAlerts}
                className="flex items-center px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 Refresh
               </button>
             </div>
          </div>
        </div>

        {loading ? (
           <div className="py-12 text-center text-zinc-500">Loading alerts...</div>
        ) : activeAlerts.length === 0 ? (
           <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900">All Good!</h3>
              <p className="text-zinc-500">No pending alerts at the moment.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`relative group rounded-xl border p-5 transition-all ${getPriorityStyles(alert.priority)} ${selectedAlerts.has(alert.id) ? 'ring-2 ring-zinc-400' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleSelectAlert(alert.id)}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.priority === 'high' && <XCircle className="w-4 h-4 text-red-600" />}
                      {alert.priority === 'medium' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <h3 className="font-semibold">{alert.title}</h3>
                      <span className="text-xs opacity-70 ml-auto">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm opacity-90">{alert.message}</p>
                    
                    {alert.type === 'edit_history' && alert.editHistory && (
                      <div className="mt-3 text-xs bg-white/50 p-2 rounded border border-black/5">
                        <span className="font-medium">{alert.editHistory.user_name}</span> changed:
                        {alert.editHistory.changed_fields.map((f, i) => (
                           <span key={i} className="ml-1">{f.field} ({f.old_value} → {f.new_value})</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-all"
                  >
                    <XCircle className="w-5 h-5 opacity-50" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
