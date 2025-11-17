'use client'

import { useState, useEffect } from 'react'
import { Settings, Building2, Car, Package, UserPlus, Trash2, Plus, Save, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MasterData {
  id: number
  company: string
  chajong: string
  pumbeon: string
  pm: string
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'master' | 'users' | 'settings'>('master')
  const [masterData, setMasterData] = useState<MasterData[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [newRow, setNewRow] = useState<Partial<MasterData>>({
    company: '',
    chajong: '',
    pumbeon: '',
    pm: ''
  })
  const [itemsPerPage, setItemsPerPage] = useState(1000)
  const [theme, setTheme] = useState<'white' | 'black' | 'silver'>('white')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    loadSettings()
  }, [])

  useEffect(() => {
    // 테마 적용
    const root = document.documentElement
    if (theme === 'black') {
      root.style.setProperty('--background', '#0a0a0a')
      root.style.setProperty('--foreground', '#ededed')
      document.body.className = 'bg-gray-900 text-gray-100'
    } else if (theme === 'silver') {
      root.style.setProperty('--background', '#f3f4f6')
      root.style.setProperty('--foreground', '#1f2937')
      document.body.className = 'bg-gray-200 text-gray-800'
    } else {
      root.style.setProperty('--background', '#ffffff')
      root.style.setProperty('--foreground', '#171717')
      document.body.className = 'bg-gray-50 text-gray-900'
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const loadSettings = () => {
    const savedTheme = localStorage.getItem('theme') as 'white' | 'black' | 'silver' | null
    const savedItemsPerPage = localStorage.getItem('itemsPerPage')
    const savedUserName = localStorage.getItem('userName')
    if (savedTheme) setTheme(savedTheme)
    if (savedItemsPerPage) setItemsPerPage(parseInt(savedItemsPerPage))
    if (savedUserName) setUserName(savedUserName)
  }

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('order_register')
        .select('id, company, chajong, pumbeon, pm')
        .not('company', 'is', null)
        .order('company')

      if (error) throw error

      // 중복 제거 (company, chajong, pumbeon 조합이 같은 것)
      const uniqueMap = new Map<string, MasterData>()
      data?.forEach(item => {
        const key = `${item.company}|${item.chajong}|${item.pumbeon}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            id: item.id,
            company: item.company,
            chajong: item.chajong,
            pumbeon: item.pumbeon,
            pm: item.pm || ''
          })
        }
      })

      setMasterData(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    }
  }

  const handleAdd = async () => {
    if (!newRow.company || !newRow.chajong || !newRow.pumbeon) {
      alert('업체명, 차종, 품번은 필수 입력 항목입니다.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('order_register')
        .insert({
          company: newRow.company,
          chajong: newRow.chajong,
          pumbeon: newRow.pumbeon,
          pm: newRow.pm || '',
          in_qty: 0,
          out_qty: 0,
          order_qty: 0
        })
        .select('id')
        .single()

      if (error) throw error

      setNewRow({ company: '', chajong: '', pumbeon: '', pm: '' })
      loadData()
      alert('추가되었습니다.')
    } catch (error) {
      console.error('추가 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (row: MasterData) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('order_register')
        .update({
          company: row.company,
          chajong: row.chajong,
          pumbeon: row.pumbeon,
          pm: row.pm || ''
        })
        .eq('id', row.id)

      if (error) throw error

      setEditingRow(null)
      loadData()
      alert('수정되었습니다.')
    } catch (error) {
      console.error('수정 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (row: MasterData) => {
    if (!confirm(`정말 삭제하시겠습니까?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('order_register')
        .delete()
        .eq('id', row.id)

      if (error) throw error

      loadData()
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem('itemsPerPage', itemsPerPage.toString())
    localStorage.setItem('theme', theme)
    localStorage.setItem('userName', userName)
    alert('설정이 저장되었습니다.')
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
              <Settings className="h-6 w-6 mr-2" />
              관리자 설정
            </h2>

            {/* 탭 메뉴 */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('master')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'master'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1" />
                  마스터 데이터
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UserPlus className="h-4 w-4 inline mr-1" />
                  회원가입
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-1" />
                  설정
                </button>
              </nav>
            </div>

            {/* 컨텐츠 */}
            {activeTab === 'master' ? (
              <div className="space-y-4">
                {/* 새 행 추가 */}
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">새 항목 추가</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={newRow.company || ''}
                      onChange={(e) => setNewRow(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="업체명 *"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newRow.chajong || ''}
                      onChange={(e) => setNewRow(prev => ({ ...prev, chajong: e.target.value }))}
                      placeholder="차종 *"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newRow.pumbeon || ''}
                      onChange={(e) => setNewRow(prev => ({ ...prev, pumbeon: e.target.value }))}
                      placeholder="품번 *"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newRow.pm || ''}
                      onChange={(e) => setNewRow(prev => ({ ...prev, pm: e.target.value }))}
                      placeholder="품명"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAdd}
                      disabled={loading || !newRow.company || !newRow.chajong || !newRow.pumbeon}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </button>
                  </div>
                </div>

                {/* 데이터 테이블 */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업체명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          차종
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          품번
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          품명
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {masterData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {editingRow === row.id ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.company}
                                  onChange={(e) => setMasterData(prev => prev.map(r => r.id === row.id ? { ...r, company: e.target.value } : r))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.chajong}
                                  onChange={(e) => setMasterData(prev => prev.map(r => r.id === row.id ? { ...r, chajong: e.target.value } : r))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.pumbeon}
                                  onChange={(e) => setMasterData(prev => prev.map(r => r.id === row.id ? { ...r, pumbeon: e.target.value } : r))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.pm}
                                  onChange={(e) => setMasterData(prev => prev.map(r => r.id === row.id ? { ...r, pm: e.target.value } : r))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdate(row)}
                                    disabled={loading}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingRow(null)
                                      loadData()
                                    }}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    취소
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.company}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.chajong}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.pumbeon}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.pm}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingRow(row.id)}
                                    disabled={loading}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  >
                                    <Edit className="h-4 w-4 inline" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(row)}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  >
                                    <Trash2 className="h-4 w-4 inline" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용자 이름
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="수정 이력에 표시될 이름을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">재고현황 수정 시 이 이름이 수정 이력에 기록됩니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    재고현황 보기 항목 수량
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15개</option>
                    <option value={25}>25개</option>
                    <option value={30}>30개</option>
                    <option value={50}>50개</option>
                    <option value={100}>100개</option>
                    <option value={1000}>전체</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배경 색상
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('white')}
                      className={`p-4 border-2 rounded-lg ${
                        theme === 'white' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-white rounded mb-2"></div>
                      <span className="text-sm font-medium">화이트</span>
                    </button>
                    <button
                      onClick={() => setTheme('black')}
                      className={`p-4 border-2 rounded-lg ${
                        theme === 'black' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
                      <span className="text-sm font-medium">블랙</span>
                    </button>
                    <button
                      onClick={() => setTheme('silver')}
                      className={`p-4 border-2 rounded-lg ${
                        theme === 'silver' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="w-full h-12 bg-gray-300 rounded mb-2"></div>
                      <span className="text-sm font-medium">연한실버</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-1" />
                  설정 저장
                </button>
              </div>
            ) : activeTab === 'users' ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">회원가입 관리</h3>
                <p className="text-gray-600">회원가입 관리 기능은 추후 구현 예정입니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder={`새 ${getTabLabel()} 입력`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={loading || !newItem.trim()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTabLabel()}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getCurrentItems().map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

