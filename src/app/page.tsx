'use client'

import { useRouter } from 'next/navigation'
import { Warehouse, BarChart3, Bell, Plus, Upload, Settings, ArrowRight, Check, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: Warehouse,
      title: '재고 현황',
      description: '실시간 재고 현황을 한눈에 확인하고 관리하세요'
    },
    {
      icon: BarChart3,
      title: '대시보드',
      description: '데이터 시각화로 재고 트렌드를 분석하세요'
    },
    {
      icon: Bell,
      title: '알림 센터',
      description: '재고 부족 및 중요 알림을 실시간으로 받아보세요'
    },
    {
      icon: Plus,
      title: '입고등록',
      description: '간편한 입고 등록으로 재고를 업데이트하세요'
    },
    {
      icon: Upload,
      title: '데이터 가져오기',
      description: 'Excel 파일로 대량 데이터를 한번에 등록하세요'
    },
    {
      icon: Settings,
      title: '관리자 설정',
      description: '마스터 데이터 및 시스템 설정을 관리하세요'
    }
  ]

  const techStack = [
    { name: 'Next.js 15', color: 'from-gray-800 to-gray-900' },
    { name: 'React 19', color: 'from-blue-500 to-blue-600' },
    { name: 'TypeScript', color: 'from-blue-600 to-blue-700' },
    { name: 'Tailwind CSS', color: 'from-cyan-500 to-blue-500' },
    { name: 'Supabase', color: 'from-green-500 to-emerald-600' },
    { name: 'Recharts', color: 'from-purple-500 to-pink-500' }
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6 overflow-hidden">
      <div className="max-w-6xl w-full h-full flex flex-col justify-center">
        {/* 헤로 섹션 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Warehouse className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              입고관리 시스템
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            실시간 재고 관리와 데이터 분석을 통해 효율적인 물류 관리를 경험하세요
          </p>
          <button
            onClick={() => router.push('/inventory')}
            className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-base font-semibold group mb-8"
          >
            시작하기
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 기능 소개 섹션 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 w-fit mb-3">
                <feature.icon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-600 leading-tight">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* 기술 스택 섹션 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">기술 스택</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${tech.color} text-white text-xs font-medium shadow-sm`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Check className="h-3 w-3 text-green-500" />
            <span>실시간 데이터 동기화</span>
            <span className="mx-1">•</span>
            <Check className="h-3 w-3 text-green-500" />
            <span>안전한 데이터 관리</span>
            <span className="mx-1">•</span>
            <Check className="h-3 w-3 text-green-500" />
            <span>직관적인 인터페이스</span>
          </div>
        </div>
      </div>
    </div>
  )
}

