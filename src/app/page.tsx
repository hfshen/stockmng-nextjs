'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Download, Edit, FileText, X } from 'lucide-react'
import { supabase, InventoryItem } from '@/lib/supabase'

// Combobox 컴포넌트
function Combobox({ 
  value, 
  onChange, 
  options, 
  placeholder,
  onAddNew 
}: { 
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  onAddNew?: (value: string) => void
}) {
  const [inputValue, setInputValue] = useState(value)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(inputValue.toLowerCase())
  )

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: string) => {
    setInputValue(option)
    onChange(option)
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowDropdown(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue && !filteredOptions.includes(inputValue)) {
      if (onAddNew) {
        onAddNew(inputValue)
      }
      setShowDropdown(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        list={`datalist-${placeholder}`}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 입고등록 모달 컴포넌트
function InboundModal({ 
  isOpen, 
  onClose, 
  item,
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  item?: InventoryItem
  onSave: () => void
}) {
  const [companies, setCompanies] = useState<string[]>([])
  const [chajongs, setChajongs] = useState<string[]>([])
  const [pumbeons, setPumbeons] = useState<string[]>([])
  const [pms, setPms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company: item?.company || '',
    chajong: item?.chajong || '',
    pumbeon: item?.pumbeon || '',
    pm: item?.pm || '',
    in_date: new Date().toISOString().slice(0, 10),
    in_qty: item?.in_qty || 0,
    order_qty: item?.order_qty || 0,
    remark: item?.remark || ''
  })

  useEffect(() => {
    if (isOpen) {
      loadOptions()
      if (item) {
        setFormData({
          company: item.company,
          chajong: item.chajong,
          pumbeon: item.pumbeon,
          pm: item.pm,
          in_date: new Date().toISOString().slice(0, 10),
          in_qty: item.in_qty,
          order_qty: item.order_qty,
          remark: item.remark || ''
        })
      }
    }
  }, [isOpen, item])

  const loadOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('order_register')
        .select('company, chajong, pumbeon, pm')
        .not('company', 'is', null)

      if (error) throw error

      const uniqueCompanies = [...new Set(data?.map(item => item.company) ?? [])]
      const uniqueChajongs = [...new Set(data?.map(item => item.chajong) ?? [])]
      const uniquePumbeons = [...new Set(data?.map(item => item.pumbeon) ?? [])]
      const uniquePms = [...new Set(data?.map(item => item.pm) ?? [])]

      setCompanies(uniqueCompanies)
      setChajongs(uniqueChajongs)
      setPumbeons(uniquePumbeons)
      setPms(uniquePms)
    } catch (error) {
      console.error('옵션 로드 오류:', error)
    }
  }

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
          out_qty: item?.out_qty || 0,
          stock_qty: formData.in_qty - (item?.out_qty || 0),
          order_qty: formData.order_qty
        })

      if (monthlyError) throw monthlyError

      alert('입고등록이 완료되었습니다.')
      onSave()
      onClose()
    } catch (error) {
      console.error('입고등록 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Plus className="h-6 w-6 mr-2" />
              입고등록
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체명 *
                </label>
                <Combobox
                  value={formData.company}
                  onChange={(value) => setFormData(prev => ({ ...prev, company: value }))}
                  options={companies}
                  placeholder="업체명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  차종 *
                </label>
                <Combobox
                  value={formData.chajong}
                  onChange={(value) => setFormData(prev => ({ ...prev, chajong: value }))}
                  options={chajongs}
                  placeholder="차종"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품번 *
                </label>
                <Combobox
                  value={formData.pumbeon}
                  onChange={(value) => setFormData(prev => ({ ...prev, pumbeon: value }))}
                  options={pumbeons}
                  placeholder="품번"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품명
                </label>
                <Combobox
                  value={formData.pm}
                  onChange={(value) => setFormData(prev => ({ ...prev, pm: value }))}
                  options={pms}
                  placeholder="품명"
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

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 수정 모달 컴포넌트
function EditModal({ 
  isOpen, 
  onClose, 
  item,
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  item?: InventoryItem
  onSave: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    in_qty: item?.in_qty || 0,
    stock_qty: item?.stock_qty || 0,
    order_qty: item?.order_qty || 0,
    out_qty: item?.out_qty || 0,
    remark: item?.remark || ''
  })

  useEffect(() => {
    if (item) {
      setFormData({
        in_qty: item.in_qty,
        stock_qty: item.stock_qty,
        order_qty: item.order_qty,
        out_qty: item.out_qty,
        remark: item.remark || ''
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setLoading(true)

    try {
      // 변경된 필드 추적
      const changedFields: { field: string; old_value: string | number; new_value: string | number }[] = []
      
      if (item.in_qty !== formData.in_qty) {
        changedFields.push({ field: '입고', old_value: item.in_qty, new_value: formData.in_qty })
      }
      if (item.stock_qty !== formData.stock_qty) {
        changedFields.push({ field: '재고', old_value: item.stock_qty, new_value: formData.stock_qty })
      }
      if (item.order_qty !== formData.order_qty) {
        changedFields.push({ field: '월발주수량', old_value: item.order_qty, new_value: formData.order_qty })
      }
      if (item.out_qty !== formData.out_qty) {
        changedFields.push({ field: '반출', old_value: item.out_qty, new_value: formData.out_qty })
      }
      if (item.remark !== formData.remark) {
        changedFields.push({ field: '비고', old_value: item.remark || '', new_value: formData.remark })
      }

      // order_register 업데이트
      const { error: updateError } = await supabase
        .from('order_register')
        .update({
          in_qty: formData.in_qty,
          out_qty: formData.out_qty,
          order_qty: formData.order_qty,
          remark: formData.remark
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      // 월별 데이터 업데이트
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { error: monthlyError } = await supabase
        .from('monthly_data')
        .upsert({
          year_month: currentMonth,
          order_id: item.id,
          in_qty: formData.in_qty,
          out_qty: formData.out_qty,
          stock_qty: formData.stock_qty,
          order_qty: formData.order_qty
        })

      if (monthlyError) throw monthlyError

      // 수정 이력 저장 (변경된 필드가 있는 경우만)
      if (changedFields.length > 0) {
        const userName = localStorage.getItem('userName') || '사용자'
        const { error: historyError } = await supabase
          .from('edit_history')
          .insert({
            order_id: item.id,
            user_name: userName,
            changed_fields: changedFields
          })

        if (historyError) {
          console.error('수정 이력 저장 오류:', historyError)
          // 이력 저장 실패해도 수정은 계속 진행
        }
      }

      alert('수정이 완료되었습니다.')
      onSave()
      onClose()
    } catch (error) {
      console.error('수정 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('order_register')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      alert('삭제가 완료되었습니다.')
      onSave()
      onClose()
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Edit className="h-6 w-6 mr-2" />
              수정
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">업체명: <span className="font-medium">{item.company}</span></p>
            <p className="text-sm text-gray-600">차종: <span className="font-medium">{item.chajong}</span></p>
            <p className="text-sm text-gray-600">품번: <span className="font-medium">{item.pumbeon}</span></p>
            <p className="text-sm text-gray-600">품명: <span className="font-medium">{item.pm}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입고
                </label>
                <input
                  type="number"
                  value={formData.in_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, in_qty: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  재고
                </label>
                <input
                  type="number"
                  value={formData.stock_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_qty: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  월발주수량
                </label>
                <input
                  type="number"
                  value={formData.order_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_qty: parseInt(e.target.value) || 0 }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반출
                </label>
                <input
                  type="number"
                  value={formData.out_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, out_qty: parseInt(e.target.value) || 0 }))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState<InventoryItem[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [chajongs, setChajongs] = useState<string[]>([])
  const [pumbeons, setPumbeons] = useState<string[]>([])
  const [pms, setPms] = useState<string[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    company: '',
    chajong: '',
    pumbeon: '',
  })
  const [sortBy, setSortBy] = useState('company')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showInboundModal, setShowInboundModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>()
  const [itemsPerPage, setItemsPerPage] = useState(1000)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingCell, setEditingCell] = useState<{itemId: number, field: 'in_qty' | 'stock_qty' | 'order_qty'} | null>(null)
  const [editValue, setEditValue] = useState('')

  // 현재 월 문자열 생성
  const getCurrentMonth = () => {
    return new Date().toISOString().slice(0, 7)
  }

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: orderData, error: orderError } = await supabase
        .from('order_register')
        .select('*')
        .order('company')

      if (orderError) throw orderError

      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('year_month', filters.month)

      if (monthlyError) throw monthlyError

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

      // 필터링 (대소문자 구분 없이)
      const filteredData = inventoryData.filter(item => {
        if (filters.company && !item.company.toLowerCase().includes(filters.company.toLowerCase())) return false
        if (filters.chajong && !item.chajong.toLowerCase().includes(filters.chajong.toLowerCase())) return false
        if (filters.pumbeon && !item.pumbeon.toLowerCase().includes(filters.pumbeon.toLowerCase())) return false
        
        return true
      })

      // 정렬
      filteredData.sort((a, b) => {
        let aValue: string | number = a[sortBy as keyof InventoryItem] as string | number
        let bValue: string | number = b[sortBy as keyof InventoryItem] as string | number
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })

      setData(filteredData)
    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // 옵션 목록 로드
  const loadOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('order_register')
        .select('company, chajong, pumbeon, pm')
        .not('company', 'is', null)

      if (error) throw error

      const uniqueCompanies = [...new Set(data?.map(item => item.company) ?? [])]
      const uniqueChajongs = [...new Set(data?.map(item => item.chajong) ?? [])]
      const uniquePumbeons = [...new Set(data?.map(item => item.pumbeon) ?? [])]
      const uniquePms = [...new Set(data?.map(item => item.pm) ?? [])]

      setCompanies(uniqueCompanies.length > 0 ? uniqueCompanies : ['명진', '선경내셔날'])
      setChajongs(uniqueChajongs)
      setPumbeons(uniquePumbeons)
      setPms(uniquePms)
    } catch (error) {
      console.error('옵션 로드 오류:', error)
      setCompanies(['명진', '선경내셔날'])
    }
  }, [])

  // 월별 목록 로드
  const loadMonths = useCallback(async () => {
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
  }, [])

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
    loadOptions()
    loadMonths()
  }, [loadData, loadOptions, loadMonths])

  const getShortageColor = (shortage: string) => {
    if (shortage.startsWith('+')) return 'text-green-600'
    if (shortage.startsWith('-')) return 'text-red-600'
    return 'text-gray-600'
  }

  // 인라인 편집 핸들러
  const handleCellDoubleClick = (item: InventoryItem, field: 'in_qty' | 'stock_qty' | 'order_qty') => {
    setEditingCell({ itemId: item.id, field })
    setEditValue(item[field].toString())
  }

  const handleCellSave = async (item: InventoryItem) => {
    if (!editingCell) return

    let newValue: number
    const trimmedValue = editValue.trim()
    
    // + 또는 - 기호가 있으면 누적 계산
    if (trimmedValue.startsWith('+')) {
      const diff = parseFloat(trimmedValue.slice(1)) || 0
      newValue = item[editingCell.field] + diff
    } else if (trimmedValue.startsWith('-')) {
      const diff = parseFloat(trimmedValue.slice(1)) || 0
      newValue = item[editingCell.field] - diff
    } else {
      newValue = parseFloat(trimmedValue) || 0
    }

    const oldValue = item[editingCell.field]
    const diff = newValue - oldValue

    try {
      // 월별 데이터 업데이트
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyData } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('year_month', currentMonth)
        .eq('order_id', item.id)
        .single()

      let updatedInQty = item.in_qty
      let updatedStockQty = item.stock_qty
      let updatedOrderQty = item.order_qty

      if (editingCell.field === 'in_qty') {
        updatedInQty = newValue
        updatedStockQty = item.stock_qty + diff // 재고도 자동 조정
      } else if (editingCell.field === 'stock_qty') {
        updatedStockQty = newValue
      } else if (editingCell.field === 'order_qty') {
        updatedOrderQty = newValue
      }

      // monthly_data 업데이트
      await supabase
        .from('monthly_data')
        .upsert({
          year_month: currentMonth,
          order_id: item.id,
          in_qty: updatedInQty,
          out_qty: item.out_qty,
          stock_qty: updatedStockQty,
          order_qty: updatedOrderQty
        })

      // 수정 이력 저장
      const userName = localStorage.getItem('userName') || '사용자'
      await supabase
        .from('edit_history')
        .insert({
          order_id: item.id,
          user_name: userName,
          changed_fields: [{
            field: editingCell.field === 'in_qty' ? '입고' : editingCell.field === 'stock_qty' ? '재고' : '월발주수량',
            old_value: oldValue,
            new_value: newValue
          }]
        })

      setEditingCell(null)
      loadData() // 데이터 다시 로드
    } catch (error) {
      console.error('셀 저장 오류:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // 페이지네이션
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = data.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                재고 현황
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setSelectedItem(undefined)
                    setShowInboundModal(true)
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  입고등록
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  내보내기
                </button>
              </div>
            </div>

            {/* 검색 필터 */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <Combobox
                    value={filters.company}
                    onChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
                    options={companies}
                    placeholder="업체명 선택 또는 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">차종</label>
                  <Combobox
                    value={filters.chajong}
                    onChange={(value) => setFilters(prev => ({ ...prev, chajong: value }))}
                    options={chajongs}
                    placeholder="차종 선택 또는 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품번</label>
                  <Combobox
                    value={filters.pumbeon}
                    onChange={(value) => setFilters(prev => ({ ...prev, pumbeon: value }))}
                    options={pumbeons}
                    placeholder="품번 선택 또는 입력"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadData}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    조회
                  </button>
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">정렬:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="company">업체명</option>
                    <option value="chajong">차종</option>
                    <option value="pumbeon">품번</option>
                    <option value="pm">품명</option>
                    <option value="in_qty">입고</option>
                    <option value="stock_qty">재고</option>
                    <option value="order_qty">발주수량</option>
                    <option value="out_qty">반출</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">보기:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={15}>15개</option>
                    <option value={25}>25개</option>
                    <option value={30}>30개</option>
                    <option value={50}>50개</option>
                    <option value={100}>100개</option>
                    <option value={1000}>전체</option>
                  </select>
                  <div className="text-sm text-gray-600">
                    총 {data.length}개 항목
                  </div>
                </div>
              </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] sm:min-w-[120px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('company')
                        setSortOrder(sortBy === 'company' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center">
                        업체명
                        {sortBy === 'company' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('chajong')
                        setSortOrder(sortBy === 'chajong' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center">
                        차종
                        {sortBy === 'chajong' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('pumbeon')
                        setSortOrder(sortBy === 'pumbeon' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center">
                        품번
                        {sortBy === 'pumbeon' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('pm')
                        setSortOrder(sortBy === 'pm' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center">
                        품명
                        {sortBy === 'pm' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('in_qty')
                        setSortOrder(sortBy === 'in_qty' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center justify-end">
                        입고
                        {sortBy === 'in_qty' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('stock_qty')
                        setSortOrder(sortBy === 'stock_qty' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center justify-end">
                        재고
                        {sortBy === 'stock_qty' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">미입고/과입고</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('order_qty')
                        setSortOrder(sortBy === 'order_qty' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center justify-end">
                        발주수량
                        {sortBy === 'order_qty' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSortBy('out_qty')
                        setSortOrder(sortBy === 'out_qty' && sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      <div className="flex items-center justify-end">
                        반출
                        {sortBy === 'out_qty' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">비고</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                        데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words">{item.company}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words" title={item.chajong}>
                          <div className="max-w-[150px] sm:max-w-[200px] truncate">{item.chajong}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words" title={item.pumbeon}>
                          <div className="max-w-[130px] sm:max-w-[180px] truncate">{item.pumbeon}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words" title={item.pm}>
                          <div className="max-w-[200px] sm:max-w-[250px] truncate">{item.pm}</div>
                        </td>
                        <td 
                          className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => handleCellDoubleClick(item, 'in_qty')}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'in_qty' ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(item)
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel()
                                  }
                                }}
                                placeholder="숫자 또는 +10, -5"
                                autoFocus
                                className="w-24 px-2 py-1 border border-blue-500 rounded text-right text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            item.in_qty.toLocaleString()
                          )}
                        </td>
                        <td 
                          className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => handleCellDoubleClick(item, 'stock_qty')}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'stock_qty' ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(item)
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel()
                                  }
                                }}
                                placeholder="숫자 또는 +10, -5"
                                autoFocus
                                className="w-24 px-2 py-1 border border-blue-500 rounded text-right text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            item.stock_qty.toLocaleString()
                          )}
                        </td>
                        <td className={`px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-right font-medium ${getShortageColor(item.in_shortage)}`}>
                          {item.in_shortage}
                        </td>
                        <td 
                          className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => handleCellDoubleClick(item, 'order_qty')}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === 'order_qty' ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellSave(item)
                                  } else if (e.key === 'Escape') {
                                    handleCellCancel()
                                  }
                                }}
                                placeholder="숫자 또는 +10, -5"
                                autoFocus
                                className="w-24 px-2 py-1 border border-blue-500 rounded text-right text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            item.order_qty.toLocaleString()
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 text-right whitespace-nowrap">{item.out_qty.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 break-words">
                          {item.remark ? (
                            <div className="relative group">
                              <FileText className="h-4 w-4 text-blue-500 inline-block" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                                {item.remark}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                              setShowEditModal(true)
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                          >
                            <Edit className="h-3 w-3 inline mr-1" />
                            수정
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 입고등록 모달 */}
      <InboundModal
        isOpen={showInboundModal}
        onClose={() => {
          setShowInboundModal(false)
          setSelectedItem(undefined)
        }}
        item={selectedItem}
        onSave={loadData}
      />

      {/* 수정 모달 */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedItem(undefined)
        }}
        item={selectedItem}
        onSave={loadData}
      />
    </div>
  )
}
