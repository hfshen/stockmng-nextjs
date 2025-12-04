'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Plus, 
  BarChart3, 
  Bell, 
  Upload,
  Warehouse,
  Menu,
  X,
  Settings
} from 'lucide-react'

const navigation = [
  { name: '재고 현황', href: '/', icon: Home },
  { name: '대시보드', href: '/dashboard', icon: BarChart3 },
  { name: '알림 센터', href: '/alerts', icon: Bell },
  { name: '입고등록', href: '/add', icon: Plus },
  { name: '데이터 가져오기', href: '/import', icon: Upload },
  { name: '관리자', href: '/admin', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-105 transition-transform">
                <Warehouse className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">입고관리</span>
            </Link>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'mr-2' : 'mr-2'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
