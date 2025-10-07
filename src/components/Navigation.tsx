'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Plus, 
  Download, 
  BarChart3, 
  Bell, 
  Upload,
  Warehouse
} from 'lucide-react'

const navigation = [
  { name: '재고 현황', href: '/', icon: Home },
  { name: '대시보드', href: '/dashboard', icon: BarChart3 },
  { name: '알림 센터', href: '/alerts', icon: Bell },
  { name: '입고등록', href: '/add', icon: Plus },
  { name: '데이터 가져오기', href: '/import', icon: Upload },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Warehouse className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">㈜다성 입고관리 Tool</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
