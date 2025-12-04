'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, CheckCircle, XCircle, Package, Edit } from 'lucide-react'
import { supabase, InventoryItem, EditHistory } from '@/lib/supabase'
import { handleError } from '@/lib/utils'

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
      
      // 재고 데이터 조회
      const { data: orderData, error: orderError } = await supabase
        .from('order_register')
        .select('*')

      if (orderError) throw orderError

      // 월별 데이터 조회
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('year_month', currentMonth)

      if (monthlyError) throw monthlyError

      // 수정 이력 조회 (최근 24시간)
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)
      
      const { data: editHistoryData, error: editHistoryError } = await supabase
        .from('edit_history')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })

      if (editHistoryError) {
        handleError(editHistoryError, '수정 이력 조회')
      }

      const newAlerts: Alert[] = []

      // 수정 이력 알림 추가
      if (editHistoryData && editHistoryData.length > 0) {
        for (const history of editHistoryData) {
          const order = orderData?.find(o => o.id === history.order_id)
          if (order) {
            const monthly = monthlyData?.find(m => m.order_id === order.id)
            const stock = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
            const order_qty = monthly?.order_qty ?? order.order_qty
            const in_qty = monthly?.in_qty ?? order.in_qty

            const item: InventoryItem = {
              id: order.id,
              company: order.company,
              chajong: order.chajong,
              pumbeon: order.pumbeon,
              pm: order.pm,
              in_qty,
              stock_qty: stock,
              in_shortage: stock <= 0 ? '0' : (order_qty - in_qty).toString(),
              order_qty,
              out_qty: monthly?.out_qty ?? order.out_qty,
              remark: order.remark
            }

            newAlerts.push({
              id: `edit_history_${history.id}`,
              type: 'edit_history',
              title: '재고 정보 수정',
              message: `${order.company} - ${order.pumbeon}의 정보가 수정되었습니다.`,
              item,
              priority: 'low',
              createdAt: history.created_at,
              editHistory: history
            })
          }
        }
      }

      orderData?.forEach(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        const stock = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        const order_qty = monthly?.order_qty ?? order.order_qty
        const in_qty = monthly?.in_qty ?? order.in_qty

        const item: InventoryItem = {
          id: order.id,
          company: order.company,
          chajong: order.chajong,
          pumbeon: order.pumbeon,
          pm: order.pm,
          in_qty,
          stock_qty: stock,
          in_shortage: stock <= 0 ? '0' : (order_qty - in_qty).toString(),
          order_qty,
          out_qty: monthly?.out_qty ?? order.out_qty,
          remark: order.remark
        }

        // 재고 없음 알림
        if (stock <= 0) {
          newAlerts.push({
            id: `out_of_stock_${order.id}`,
            type: 'out_of_stock',
            title: '재고 없음',
            message: `${order.company} - ${order.pumbeon}의 재고가 없습니다.`,
            item,
            priority: 'high',
            createdAt: new Date().toISOString()
          })
        }
        // 부족 재고 알림
        else if (stock <= 10) {
          newAlerts.push({
            id: `low_stock_${order.id}`,
            type: 'low_stock',
            title: '부족 재고',
            message: `${order.company} - ${order.pumbeon}의 재고가 ${stock}개로 부족합니다.`,
            item,
            priority: 'medium',
            createdAt: new Date().toISOString()
          })
        }
        // 높은 수요 알림 (발주량 대비 재고가 20% 미만)
        else if (order_qty > 0 && (stock / order_qty) < 0.2) {
          newAlerts.push({
            id: `high_demand_${order.id}`,
            type: 'high_demand',
            title: '높은 수요',
            message: `${order.company} - ${order.pumbeon}의 수요가 높습니다. (재고: ${stock}/${order_qty})`,
            item,
            priority: 'medium',
            createdAt: new Date().toISOString()
          })
        }
      })

      // 우선순위별 정렬 (high -> medium -> low)
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
    setSelectedAlerts(prev => {
      const newSet = new Set(prev)
      newSet.delete(alertId)
      return newSet
    })
  }

  const toggleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      return newSet
    })
  }

  const selectAllAlerts = () => {
    if (selectedAlerts.size === activeAlerts.length) {
      setSelectedAlerts(new Set())
    } else {
      setSelectedAlerts(new Set(activeAlerts.map(alert => alert.id)))
    }
  }

  const deleteSelectedAlerts = () => {
    if (selectedAlerts.size === 0) return
    if (confirm(`선택한 ${selectedAlerts.size}개의 알림을 삭제하시겠습니까?`)) {
      setDismissedAlerts(prev => new Set([...prev, ...selectedAlerts]))
      setSelectedAlerts(new Set())
    }
  }

  const deleteAllAlerts = () => {
    if (activeAlerts.length === 0) return
    if (confirm(`모든 알림(${activeAlerts.length}개)을 삭제하시겠습니까?`)) {
      setDismissedAlerts(new Set(activeAlerts.map(alert => alert.id)))
      setSelectedAlerts(new Set())
    }
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'out_of_stock':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'low_stock':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'high_demand':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'expiring_soon':
        return <Package className="h-5 w-5 text-orange-500" />
      case 'edit_history':
        return <Edit className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getAlertColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 mr-2 text-yellow-600" />
              <h1 className="text-2xl font-bold text-gray-900">알림 센터</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                총 {activeAlerts.length}개의 알림
                {selectedAlerts.size > 0 && ` (${selectedAlerts.size}개 선택됨)`}
              </span>
              {selectedAlerts.size > 0 && (
                <button
                  onClick={deleteSelectedAlerts}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  선택 삭제
                </button>
              )}
              {activeAlerts.length > 0 && (
                <button
                  onClick={deleteAllAlerts}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  일괄 삭제
                </button>
              )}
              <button
                onClick={loadAlerts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">알림을 불러오는 중...</p>
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">알림이 없습니다</h3>
            <p className="text-gray-600">현재 모든 재고가 정상 상태입니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === activeAlerts.length && activeAlerts.length > 0}
                  onChange={selectAllAlerts}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">전체 선택</span>
              </label>
            </div>
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-6 ${getAlertColor(alert.priority)} ${
                  selectedAlerts.has(alert.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleSelectAlert(alert.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${alert.title} 선택`}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.priority === 'high' ? '긴급' :
                           alert.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{alert.message}</p>
                      
                      {/* 수정 이력 정보 */}
                      {alert.type === 'edit_history' && alert.editHistory && (
                        <div className="mt-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2">수정 내역</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-purple-700">수정자:</span>
                              <span className="ml-2 text-purple-900">{alert.editHistory.user_name}</span>
                            </div>
                            <div>
                              <span className="font-medium text-purple-700">수정 시간:</span>
                              <span className="ml-2 text-purple-900">
                                {new Date(alert.editHistory.created_at).toLocaleString('ko-KR')}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-purple-700">변경 내용:</span>
                              <div className="mt-1 space-y-1">
                                {alert.editHistory.changed_fields.map((field, index) => (
                                  <div key={index} className="bg-white rounded p-2 border border-purple-100">
                                    <span className="font-medium text-purple-800">{field.field}:</span>
                                    <span className="ml-2 text-gray-700 line-through">{field.old_value}</span>
                                    <span className="mx-2 text-purple-600">→</span>
                                    <span className="text-gray-900 font-medium">{field.new_value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 아이템 상세 정보 */}
                      {alert.item && (
                        <div className="mt-4 bg-white rounded-lg p-4 border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">업체:</span>
                              <p className="text-gray-900">{alert.item.company}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">차종:</span>
                              <p className="text-gray-900">{alert.item.chajong}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">품번:</span>
                              <p className="text-gray-900">{alert.item.pumbeon}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">현재 재고:</span>
                              <p className="text-gray-900">{alert.item.stock_qty}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">발주량:</span>
                              <p className="text-gray-900">{alert.item.order_qty}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">입고량:</span>
                              <p className="text-gray-900">{alert.item.in_qty}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">반출량:</span>
                              <p className="text-gray-900">{alert.item.out_qty}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">미입고/과입고:</span>
                              <p className={`font-medium ${
                                alert.item.in_shortage.startsWith('+') ? 'text-green-600' :
                                alert.item.in_shortage.startsWith('-') ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {alert.item.in_shortage}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      aria-label="알림 삭제"
                      title="알림 삭제"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
