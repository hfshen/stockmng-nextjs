'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Download, Edit2, X, ArrowUpDown, Filter, Trash2 } from 'lucide-react'
import { supabase, InventoryItem } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { handleError } from '@/lib/utils'
import { useLanguage } from '@/components/LanguageContext'

// Styled Combobox
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
        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder:text-zinc-400"
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-20 w-full mt-1 bg-white border border-zinc-100 rounded-lg shadow-xl max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Styled InboundModal
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
  const { showToast } = useToast()
  const { t } = useLanguage()
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
      handleError(error, '옵션 로드')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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

      const { error: inRegisterError } = await supabase
        .from('in_register')
        .insert({
          order_id: orderId,
          in_date: formData.in_date,
          in_count: formData.in_qty
        })

      if (inRegisterError) throw inRegisterError

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

      showToast(t.common.success, 'success')
      onSave()
      onClose()
    } catch (error) {
      const message = handleError(error, '입고등록')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{t.inventory.modals.inboundTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label={t.inventory.modals.cancel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { label: t.inventory.modals.supplier, value: formData.company, key: 'company', options: companies, req: true },
                { label: t.inventory.modals.model, value: formData.chajong, key: 'chajong', options: chajongs, req: true },
                { label: t.inventory.modals.partNo, value: formData.pumbeon, key: 'pumbeon', options: pumbeons, req: true },
                { label: t.inventory.modals.partName, value: formData.pm, key: 'pm', options: pms, req: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    {field.label} {field.req && <span className="text-red-500">*</span>}
                  </label>
                  <Combobox
                    value={field.value}
                    onChange={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
                    options={field.options}
                    placeholder={`${field.label}`}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t.inventory.modals.inDate}</label>
                  <input
                    type="date"
                    value={formData.in_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, in_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    aria-label={t.inventory.modals.inDate}
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t.inventory.modals.inQty}</label>
                <input
                  type="number"
                  value={formData.in_qty === 0 ? '' : formData.in_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, in_qty: parseInt(e.target.value) || 0 }))}
                  onFocus={(e) => e.target.value === '0' && e.target.select()}
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="0"
                  aria-label={t.inventory.modals.inQty}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t.inventory.modals.orderQty}</label>
                <input
                  type="number"
                  value={formData.order_qty === 0 ? '' : formData.order_qty}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_qty: parseInt(e.target.value) || 0 }))}
                  onFocus={(e) => e.target.value === '0' && e.target.select()}
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  placeholder="0"
                  aria-label={t.inventory.modals.orderQty}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t.inventory.modals.notes}</label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                placeholder={t.inventory.modals.notes}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 font-medium text-sm transition-all"
              >
                {t.inventory.modals.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium text-sm transition-all shadow-sm"
              >
                {loading ? t.inventory.modals.saving : t.inventory.modals.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Styled EditModal
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
  const { showToast } = useToast()
  const { t } = useLanguage()
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
      const changedFields: { field: string; old_value: string | number; new_value: string | number }[] = []
      
      if (item.in_qty !== formData.in_qty) changedFields.push({ field: '입고', old_value: item.in_qty, new_value: formData.in_qty })
      if (item.stock_qty !== formData.stock_qty) changedFields.push({ field: '재고', old_value: item.stock_qty, new_value: formData.stock_qty })
      if (item.order_qty !== formData.order_qty) changedFields.push({ field: '월발주수량', old_value: item.order_qty, new_value: formData.order_qty })
      if (item.out_qty !== formData.out_qty) changedFields.push({ field: '반출', old_value: item.out_qty, new_value: formData.out_qty })
      if (item.remark !== formData.remark) changedFields.push({ field: '비고', old_value: item.remark || '', new_value: formData.remark })

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

      if (changedFields.length > 0) {
        const userName = localStorage.getItem('userName') || '사용자'
        const { error: historyError } = await supabase
          .from('edit_history')
          .insert({
            order_id: item.id,
            user_name: userName,
            changed_fields: changedFields
          })
          
        if (historyError) console.error(historyError)
      }

      showToast(t.common.success, 'success')
      onSave()
      onClose()
    } catch (error) {
      const message = handleError(error, '수정')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    if (!confirm(t.common.confirm + '?')) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('order_register')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      showToast(t.common.success, 'success')
      onSave()
      onClose()
    } catch (error) {
      const message = handleError(error, '삭제')
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-zinc-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-900">{t.inventory.modals.editTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              aria-label={t.inventory.modals.cancel}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-zinc-500">{t.inventory.modals.supplier}: <span className="text-zinc-900 font-medium">{item.company}</span></p>
              <p className="text-zinc-500">{t.inventory.modals.model}: <span className="text-zinc-900 font-medium">{item.chajong}</span></p>
              <p className="text-zinc-500">{t.inventory.modals.partNo}: <span className="text-zinc-900 font-medium">{item.pumbeon}</span></p>
              <p className="text-zinc-500">{t.inventory.modals.partName}: <span className="text-zinc-900 font-medium">{item.pm}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'in_qty', label: t.inventory.modals.inQty },
                { key: 'stock_qty', label: t.inventory.columns.stock },
                { key: 'order_qty', label: t.inventory.modals.orderQty },
                { key: 'out_qty', label: t.inventory.columns.outbound }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={formData[field.key as keyof typeof formData] as number}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    placeholder="0"
                    aria-label={field.label}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">{t.inventory.modals.notes}</label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100 mt-6">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t.inventory.modals.delete}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 font-medium text-sm transition-all"
                >
                  {t.inventory.modals.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium text-sm transition-all shadow-sm"
                >
                  {t.inventory.modals.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Main Page
export default function Home() {
  const { showToast } = useToast()
  const { t } = useLanguage()
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

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: orderData, error: orderError } = await supabase.from('order_register').select('*').order('company')
      if (orderError) throw orderError

      const { data: monthlyData, error: monthlyError } = await supabase.from('monthly_data').select('*').eq('year_month', filters.month)
      if (monthlyError) throw monthlyError

      const inventoryData: InventoryItem[] = orderData?.map(order => {
        const monthly = monthlyData?.find(m => m.order_id === order.id)
        const in_qty = monthly?.in_qty ?? order.in_qty
        const stock_qty = monthly?.stock_qty ?? (order.in_qty - order.out_qty)
        const order_qty = monthly?.order_qty ?? order.order_qty
        const out_qty = monthly?.out_qty ?? order.out_qty
        
        const in_shortage = order_qty - in_qty + out_qty
        let display_in_shortage = '0'
        if (in_shortage < 0) display_in_shortage = `+${Math.abs(in_shortage)}`
        else if (in_shortage > 0) display_in_shortage = `-${in_shortage}`

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

      const filteredData = inventoryData.filter(item => {
        if (filters.company && !item.company.toLowerCase().includes(filters.company.toLowerCase())) return false
        if (filters.chajong && !item.chajong.toLowerCase().includes(filters.chajong.toLowerCase())) return false
        if (filters.pumbeon && !item.pumbeon.toLowerCase().includes(filters.pumbeon.toLowerCase())) return false
        return true
      })

      filteredData.sort((a, b) => {
        let aValue = a[sortBy as keyof InventoryItem] as string | number
        let bValue = b[sortBy as keyof InventoryItem] as string | number
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }
        if (sortOrder === 'asc') return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      })

      setData(filteredData)
    } catch (error) {
      const message = handleError(error, '데이터 로드')
      showToast(message, 'error')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder, showToast])

  const loadOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('order_register').select('company, chajong, pumbeon, pm').not('company', 'is', null)
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
      handleError(error, '옵션 로드')
      setCompanies(['명진', '선경내셔날'])
    }
  }, [])

  const loadMonths = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('monthly_data').select('year_month').order('year_month', { ascending: false })
      if (error) throw error
      const uniqueMonths = [...new Set(data?.map(item => item.year_month) ?? [])]
      setMonths(uniqueMonths.length > 0 ? uniqueMonths : [getCurrentMonth()])
    } catch (error) {
      handleError(error, '월별 목록 로드')
      setMonths([getCurrentMonth()])
    }
  }, [])

  useEffect(() => {
    loadData()
    loadOptions()
    loadMonths()
  }, [loadData, loadOptions, loadMonths])

  const exportCSV = () => {
    const headers = [
      t.inventory.columns.company,
      t.inventory.columns.model,
      t.inventory.columns.partNo,
      t.inventory.columns.partName,
      t.inventory.columns.inbound,
      t.inventory.columns.stock,
      t.inventory.columns.shortage,
      t.inventory.columns.order,
      t.inventory.columns.outbound,
      t.inventory.columns.note
    ]
    const csvContent = [headers.join(','), ...data.map(item => [item.company, item.chajong, item.pumbeon, item.pm, item.in_qty, item.stock_qty, item.in_shortage, item.order_qty, item.out_qty, item.remark].join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'inventory_data.csv'
    link.click()
  }

  const handleCellDoubleClick = (item: InventoryItem, field: 'in_qty' | 'stock_qty' | 'order_qty') => {
    setEditingCell({ itemId: item.id, field })
    setEditValue(item[field].toString())
  }

  const handleCellSave = async (item: InventoryItem) => {
    if (!editingCell) return
    let newValue: number
    const trimmedValue = editValue.trim()
    if (trimmedValue.startsWith('+')) newValue = item[editingCell.field] + (parseFloat(trimmedValue.slice(1)) || 0)
    else if (trimmedValue.startsWith('-')) newValue = item[editingCell.field] - (parseFloat(trimmedValue.slice(1)) || 0)
    else newValue = parseFloat(trimmedValue) || 0

    const oldValue = item[editingCell.field]
    const diff = newValue - oldValue

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      await supabase.from('monthly_data').select('*').eq('year_month', currentMonth).eq('order_id', item.id).single()
      
      let updatedInQty = item.in_qty
      let updatedStockQty = item.stock_qty
      let updatedOrderQty = item.order_qty

      if (editingCell.field === 'in_qty') { updatedInQty = newValue; updatedStockQty = item.stock_qty + diff }
      else if (editingCell.field === 'stock_qty') { updatedStockQty = newValue }
      else if (editingCell.field === 'order_qty') { updatedOrderQty = newValue }

      await supabase.from('monthly_data').upsert({
        year_month: currentMonth,
        order_id: item.id,
        in_qty: updatedInQty,
        out_qty: item.out_qty,
        stock_qty: updatedStockQty,
        order_qty: updatedOrderQty
      })

      await supabase.from('edit_history').insert({
        order_id: item.id,
        user_name: localStorage.getItem('userName') || '사용자',
        changed_fields: [{ field: editingCell.field === 'in_qty' ? '입고' : editingCell.field === 'stock_qty' ? '재고' : '월발주수량', old_value: oldValue, new_value: newValue }]
      })

      setEditingCell(null)
      loadData()
      showToast(t.common.success, 'success')
    } catch (error) {
      const message = handleError(error, '셀 저장')
      showToast(message, 'error')
    }
  }

  const getShortageColor = (shortage: string) => {
    if (shortage.startsWith('+')) return 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full'
    if (shortage.startsWith('-')) return 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full'
    return 'text-zinc-500'
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t.inventory.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">{t.inventory.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setSelectedItem(undefined); setShowInboundModal(true) }}
              className="flex items-center justify-center px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all shadow-sm text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.inventory.addItem}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center justify-center px-4 py-2 bg-white text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-all text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              {t.inventory.exportCsv}
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                className="w-full pl-3 pr-10 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                aria-label="Filter by month"
              >
                {months.map(month => <option key={month} value={month}>{month}</option>)}
              </select>
              <Filter className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
            <Combobox value={filters.company} onChange={(v) => setFilters(p => ({ ...p, company: v }))} options={companies} placeholder={t.inventory.placeholders.company} />
            <Combobox value={filters.chajong} onChange={(v) => setFilters(p => ({ ...p, chajong: v }))} options={chajongs} placeholder={t.inventory.placeholders.model} />
            <Combobox value={filters.pumbeon} onChange={(v) => setFilters(p => ({ ...p, pumbeon: v }))} options={pumbeons} placeholder={t.inventory.placeholders.partNo} />
            <button
              onClick={loadData}
              className="w-full px-4 py-2 bg-white text-zinc-900 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all text-sm font-medium"
            >
              {t.inventory.applyFilters}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  {[
                    { key: 'company', label: t.inventory.columns.company },
                    { key: 'chajong', label: t.inventory.columns.model },
                    { key: 'pumbeon', label: t.inventory.columns.partNo },
                    { key: 'pm', label: t.inventory.columns.partName },
                    { key: 'in_qty', label: t.inventory.columns.inbound, align: 'right' },
                    { key: 'stock_qty', label: t.inventory.columns.stock, align: 'right' },
                    { key: 'in_shortage', label: t.inventory.columns.shortage, align: 'right' },
                    { key: 'order_qty', label: t.inventory.columns.order, align: 'right' },
                    { key: 'out_qty', label: t.inventory.columns.outbound, align: 'right' },
                  ].map((col) => (
                    <th 
                      key={col.key}
                      onClick={() => { setSortBy(col.key); setSortOrder(sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc') }}
                      className={`px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                        {col.label}
                        {sortBy === col.key && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.inventory.columns.note}</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.inventory.columns.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan={11} className="px-6 py-12 text-center text-zinc-500">{t.inventory.loading}</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-12 text-center text-zinc-500">{t.inventory.noData}</td></tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-zinc-900 font-medium">{item.company}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{item.chajong}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 font-mono">{item.pumbeon}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 max-w-[200px] truncate" title={item.pm}>{item.pm}</td>
                      
                      {/* Numeric Cells with Inline Edit */}
                      {['in_qty', 'stock_qty', 'order_qty'].map(field => (
                        <td 
                          key={field}
                          className="px-6 py-4 text-sm text-right cursor-pointer hover:bg-zinc-100"
                          onDoubleClick={() => handleCellDoubleClick(item, field as any)}
                        >
                          {editingCell?.itemId === item.id && editingCell.field === field ? (
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleCellSave(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave(item)
                                else if (e.key === 'Escape') { setEditingCell(null); setEditValue('') }
                              }}
                              className="w-20 px-1 py-0.5 text-right border border-zinc-900 rounded bg-white text-sm focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Edit ${field}`}
                            />
                          ) : (
                            <span className={field === 'stock_qty' && item.stock_qty < 0 ? 'text-red-600 font-medium' : 'text-zinc-700'}>
                              {item[field as keyof InventoryItem].toLocaleString()}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Shortage Cell */}
                      <td className="px-6 py-4 text-right">
                         <span className={`text-xs font-semibold ${getShortageColor(item.in_shortage)}`}>
                           {item.in_shortage}
                         </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-right text-zinc-700">{item.out_qty.toLocaleString()}</td>
                      
                      <td className="px-6 py-4 text-sm text-zinc-500 max-w-[150px] truncate" title={item.remark}>{item.remark || '-'}</td>
                      
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowEditModal(true) }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          aria-label={t.inventory.modals.editTitle}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">{t.inventory.pagination.show}</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                className="text-sm border border-zinc-200 rounded px-2 py-1 focus:ring-zinc-900"
                aria-label="Rows per page"
              >
                <option value={15}>15</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>All</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-50"
              >
                {t.inventory.pagination.previous}
              </button>
              <span className="text-sm text-zinc-600">{t.inventory.pagination.page} {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-50"
              >
                {t.inventory.pagination.next}
              </button>
            </div>
          </div>
        </div>
      </div>

      <InboundModal
        isOpen={showInboundModal}
        onClose={() => { setShowInboundModal(false); setSelectedItem(undefined) }}
        item={selectedItem}
        onSave={loadData}
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedItem(undefined) }}
        item={selectedItem}
        onSave={loadData}
      />
    </div>
  )
}
