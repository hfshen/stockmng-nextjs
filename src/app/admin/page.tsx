'use client'

import { useState, useEffect } from 'react'
import { Settings, Building2, Car, Package, UserPlus, Trash2, Plus, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'company' | 'chajong' | 'pumbeon' | 'pm' | 'users' | 'settings'>('company')
  const [companies, setCompanies] = useState<string[]>([])
  const [chajongs, setChajongs] = useState<string[]>([])
  const [pumbeons, setPumbeons] = useState<string[]>([])
  const [pms, setPms] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')
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
      console.error('데이터 로드 오류:', error)
    }
  }

  const handleAdd = async () => {
    if (!newItem.trim()) return

    setLoading(true)
    try {
      // 실제로는 데이터베이스에 추가하는 로직이 필요하지만,
      // 여기서는 예시로 로컬 상태만 업데이트
      if (activeTab === 'company') {
        if (!companies.includes(newItem)) {
          setCompanies([...companies, newItem])
        }
      } else if (activeTab === 'chajong') {
        if (!chajongs.includes(newItem)) {
          setChajongs([...chajongs, newItem])
        }
      } else if (activeTab === 'pumbeon') {
        if (!pumbeons.includes(newItem)) {
          setPumbeons([...pumbeons, newItem])
        }
      } else if (activeTab === 'pm') {
        if (!pms.includes(newItem)) {
          setPms([...pms, newItem])
        }
      }
      setNewItem('')
      alert('추가되었습니다.')
    } catch (error) {
      console.error('추가 오류:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item: string) => {
    if (!confirm(`정말 삭제하시겠습니까?`)) return

    setLoading(true)
    try {
      if (activeTab === 'company') {
        setCompanies(companies.filter(c => c !== item))
      } else if (activeTab === 'chajong') {
        setChajongs(chajongs.filter(c => c !== item))
      } else if (activeTab === 'pumbeon') {
        setPumbeons(pumbeons.filter(p => p !== item))
      } else if (activeTab === 'pm') {
        setPms(pms.filter(p => p !== item))
      }
      alert('삭제되었습니다.')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('오류가 발생했습니다.')
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

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'company':
        return companies
      case 'chajong':
        return chajongs
      case 'pumbeon':
        return pumbeons
      case 'pm':
        return pms
      default:
        return []
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case 'company':
        return '업체명'
      case 'chajong':
        return '차종'
      case 'pumbeon':
        return '품번'
      case 'pm':
        return '품명'
      default:
        return ''
    }
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
                  onClick={() => setActiveTab('company')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'company'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-4 w-4 inline mr-1" />
                  업체명
                </button>
                <button
                  onClick={() => setActiveTab('chajong')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chajong'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Car className="h-4 w-4 inline mr-1" />
                  차종
                </button>
                <button
                  onClick={() => setActiveTab('pumbeon')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pumbeon'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1" />
                  품번
                </button>
                <button
                  onClick={() => setActiveTab('pm')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pm'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1" />
                  품명
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
            {activeTab === 'settings' ? (
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

