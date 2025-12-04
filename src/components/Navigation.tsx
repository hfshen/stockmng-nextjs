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
  Settings,
  Globe
} from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  const navigation = [
    { name: t.nav.inventory, href: '/inventory', icon: Home },
    { name: t.nav.dashboard, href: '/dashboard', icon: BarChart3 },
    { name: t.nav.alerts, href: '/alerts', icon: Bell },
    { name: t.nav.add, href: '/add', icon: Plus },
    { name: t.nav.import, href: '/import', icon: Upload },
    { name: t.nav.admin, href: '/admin', icon: Settings },
  ]

  // 랜딩 페이지에서는 Navigation 숨기기
  if (pathname === '/') {
    return null
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko')
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
                  key={item.href}
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
            
            {/* 언어 토글 버튼 */}
            <div className="pl-2 ml-2 border-l border-zinc-200">
              <button
                onClick={toggleLanguage}
                className="flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all"
              >
                <Globe className="h-4 w-4 mr-2" />
                <span className={language === 'ko' ? 'font-bold text-zinc-900' : ''}>KR</span>
                <span className="mx-1 text-zinc-300">|</span>
                <span className={language === 'en' ? 'font-bold text-zinc-900' : ''}>EN</span>
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              <span className="text-xs font-bold">{language === 'ko' ? 'KR' : 'EN'}</span>
            </button>
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
                    key={item.href}
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
