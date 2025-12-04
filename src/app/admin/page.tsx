'use client'

import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Edit, ArrowLeft, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { handleError } from '@/lib/utils'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageContext'

interface MasterData {
  id: number
  company: string
  chajong: string
  pumbeon: string
  pm: string
}

export default function Admin() {
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'master' | 'settings'>('master')
  const [masterData, setMasterData] = useState<MasterData[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [newRow, setNewRow] = useState<Partial<MasterData>>({ company: '', chajong: '', pumbeon: '', pm: '' })
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('order_register').select('id, company, chajong, pumbeon, pm').order('company')
      if (error) throw error
      const uniqueMap = new Map<string, MasterData>()
      data?.forEach(item => {
        const key = `${item.company}|${item.chajong}|${item.pumbeon}`
        if (!uniqueMap.has(key)) uniqueMap.set(key, { ...item, pm: item.pm || '' })
      })
      setMasterData(Array.from(uniqueMap.values()))
    } catch (error) {
      handleError(error, '데이터 로드')
    }
  }, [])

  useEffect(() => {
    loadData()
    setUserName(localStorage.getItem('userName') || '')
  }, [loadData])

  const handleAdd = async () => {
    if (!newRow.company || !newRow.chajong || !newRow.pumbeon) return
    setLoading(true)
    try {
      const { error } = await supabase.from('order_register').insert({ ...newRow, in_qty: 0, out_qty: 0, order_qty: 0 })
      if (error) throw error
      setNewRow({ company: '', chajong: '', pumbeon: '', pm: '' })
      loadData()
      showToast(t.common.success, 'success')
    } catch (error) { handleError(error, '추가') } finally { setLoading(false) }
  }

  const handleUpdate = async (row: MasterData) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('order_register').update(row).eq('id', row.id)
      if (error) throw error
      setEditingRow(null)
      loadData()
      showToast(t.common.success, 'success')
    } catch (error) { handleError(error, '수정') } finally { setLoading(false) }
  }

  const handleDelete = async (row: MasterData) => {
    if (!confirm(t.common.confirm + '?')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('order_register').delete().eq('id', row.id)
      if (error) throw error
      loadData()
      showToast(t.common.success, 'success')
    } catch (error) { handleError(error, '삭제') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/inventory" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.admin.back}
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t.admin.title}</h1>
          <p className="text-zinc-500 mt-2">{t.admin.description}</p>
        </div>

        <div className="flex gap-8 items-start">
           {/* Sidebar Tabs */}
           <div className="w-64 flex-shrink-0 space-y-1">
              <button 
                onClick={() => setActiveTab('master')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'master' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                <Package className="w-4 h-4" />
                {t.admin.tabs.master}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                <SettingsIcon className="w-4 h-4" />
                {t.admin.tabs.settings}
              </button>
           </div>

           {/* Content Area */}
           <div className="flex-1 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden min-h-[500px]">
              {activeTab === 'master' ? (
                 <div className="p-6">
                    <div className="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                       <h3 className="text-sm font-semibold text-zinc-900 mb-3">{t.admin.addTitle}</h3>
                       <div className="grid grid-cols-5 gap-3">
                          {[t.admin.columns.supplier, t.admin.columns.model, t.admin.columns.partNo, t.admin.columns.partName].map((ph, i) => (
                             <input 
                                key={i}
                                type="text"
                                placeholder={ph}
                                aria-label={ph}
                                value={Object.values(newRow)[i]}
                                onChange={e => setNewRow(prev => ({ ...prev, [Object.keys(newRow)[i]]: e.target.value }))}
                                className="px-3 py-2 bg-white border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                             />
                          ))}
                          <button 
                            onClick={handleAdd}
                            disabled={loading || !newRow.company}
                            className="flex items-center justify-center bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 text-sm font-medium"
                          >
                             <Plus className="w-4 h-4 mr-1" /> {t.admin.addBtn}
                          </button>
                       </div>
                    </div>

                    <div className="border border-zinc-100 rounded-lg overflow-hidden">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase text-xs">
                             <tr>
                                {[t.admin.columns.supplier, t.admin.columns.model, t.admin.columns.partNo, t.admin.columns.partName, t.admin.columns.action].map(h => (
                                   <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                             {masterData.map(row => (
                                <tr key={row.id} className="hover:bg-zinc-50">
                                   {editingRow === row.id ? (
                                      <>
                                         {['company', 'chajong', 'pumbeon', 'pm'].map(key => (
                                            <td key={key} className="px-4 py-3">
                                               <input 
                                                  value={row[key as keyof MasterData]}
                                                  aria-label={`Edit ${key}`}
                                                  onChange={e => setMasterData(prev => prev.map(r => r.id === row.id ? { ...r, [key]: e.target.value } : r))}
                                                  className="w-full px-2 py-1 border rounded"
                                               />
                                            </td>
                                         ))}
                                         <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => handleUpdate(row)} className="text-blue-600 font-medium">{t.common.save}</button>
                                            <button onClick={() => { setEditingRow(null); loadData() }} className="text-zinc-500">{t.common.cancel}</button>
                                         </td>
                                      </>
                                   ) : (
                                      <>
                                         <td className="px-4 py-3">{row.company}</td>
                                         <td className="px-4 py-3">{row.chajong}</td>
                                         <td className="px-4 py-3 font-mono text-zinc-600">{row.pumbeon}</td>
                                         <td className="px-4 py-3">{row.pm}</td>
                                         <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => setEditingRow(row.id)} className="text-zinc-400 hover:text-zinc-900" aria-label="Edit"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(row)} className="text-zinc-400 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                                         </td>
                                      </>
                                   )}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              ) : (
                 <div className="p-8 max-w-lg">
                    <h3 className="text-lg font-medium text-zinc-900 mb-6">{t.admin.settings.userPref}</h3>
                    <div className="space-y-6">
                       <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">{t.admin.settings.displayName}</label>
                          <input 
                            type="text" 
                            value={userName} 
                            onChange={e => setUserName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            aria-label={t.admin.settings.displayName}
                          />
                          <p className="text-xs text-zinc-500 mt-1">{t.admin.settings.displayNameDesc}</p>
                       </div>
                       <button 
                          onClick={() => { localStorage.setItem('userName', userName); showToast(t.admin.settings.saved, 'success') }}
                          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 font-medium text-sm"
                        >
                          {t.admin.settings.save}
                        </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
