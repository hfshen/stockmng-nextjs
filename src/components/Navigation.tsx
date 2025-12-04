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
  { name: '재고 현황', href: '/inventory', icon: Home },
  { name: '대시보드', href: '/dashboard', icon: BarChart3 },
  { name: '알림 센터', href: '/alerts', icon: Bell },
  { name: '입고등록', href: '/add', icon: Plus },
  { name: '데이터 가져오기', href: '/import', icon: Upload },
  { name: '관리자', href: '/admin', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 랜딩 페이지에서는 Navigation 숨기기
  if (pathname === '/') {
    return null
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/inventory" className="flex items-center group gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white group-hover:bg-zinc-800 transition-colors">
                <Warehouse className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-900">StockMng</span>
            </Link>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-900'} mr-2`} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-100">
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
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
