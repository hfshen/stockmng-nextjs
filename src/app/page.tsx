'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Command, Zap, Shield, Globe } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white overflow-hidden flex flex-col">

      {/* Navbar Placeholder with Language Toggle */}
      <div className="h-14 flex items-center justify-end px-6 max-w-7xl mx-auto w-full">
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

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-6 lg:px-8 pt-4 md:pt-0">

        {/* Left Content */}
        <div className="flex-1 flex flex-col justify-center items-start z-10 md:pr-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
            </span>
            {t.landing.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6 leading-[1.1] whitespace-pre-line"
          >
            {t.landing.title}
            <span className="text-zinc-400">{t.landing.titleSuffix}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-500 mb-8 max-w-lg leading-relaxed"
          >
            {t.landing.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95">
                {t.landing.startBtn}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
              <Command className="w-4 h-4 text-zinc-400" />
              {t.landing.docsBtn}
            </button>
          </motion.div>

          {/* Feature List (Small) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 pt-8 border-t border-zinc-100 w-full"
          >
            <div className="grid grid-cols-2 gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                <span>{t.landing.features.sync}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                <span>{t.landing.features.analytics}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                <span>{t.landing.features.team}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                <span>{t.landing.features.export}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Visual (Abstract UI) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex-1 hidden md:flex items-center justify-center relative"
        >
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

          {/* Abstract Interface Card */}
          <div className="relative w-full max-w-lg aspect-square">
            {/* Main Card */}
            <div className="absolute inset-0 bg-white rounded-xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="h-12 border-b border-zinc-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-200"></div>
              </div>
              {/* Body */}
              <div className="flex-1 p-6 flex flex-col gap-4 bg-zinc-50/30">
                <div className="flex gap-4">
                  <div className="w-1/3 h-24 bg-white rounded-lg border border-zinc-100 shadow-sm p-3">
                    <div className="w-8 h-8 rounded bg-zinc-100 mb-2"></div>
                    <div className="w-16 h-2 rounded bg-zinc-100"></div>
                  </div>
                  <div className="w-1/3 h-24 bg-white rounded-lg border border-zinc-100 shadow-sm p-3">
                    <div className="w-8 h-8 rounded bg-zinc-100 mb-2"></div>
                    <div className="w-16 h-2 rounded bg-zinc-100"></div>
                  </div>
                  <div className="w-1/3 h-24 bg-white rounded-lg border border-zinc-100 shadow-sm p-3">
                    <div className="w-8 h-8 rounded bg-zinc-100 mb-2"></div>
                    <div className="w-16 h-2 rounded bg-zinc-100"></div>
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-lg border border-zinc-100 shadow-sm p-4">
                  <div className="flex justify-between mb-4">
                    <div className="w-32 h-4 rounded bg-zinc-100"></div>
                    <div className="w-16 h-4 rounded bg-zinc-100"></div>
                  </div>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4 mb-3 last:mb-0">
                      <div className="w-8 h-8 rounded bg-zinc-50"></div>
                      <div className="flex-1 h-2 rounded bg-zinc-50"></div>
                      <div className="w-12 h-2 rounded bg-zinc-50"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Element 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-8 top-20 w-48 p-4 bg-white rounded-lg border border-zinc-200 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 rounded bg-zinc-100">
                  <Zap className="w-4 h-4 text-zinc-900" />
                </div>
                <span className="text-sm font-semibold">{t.landing.floating.fast}</span>
              </div>
              <div className="text-xs text-zinc-500">{t.landing.floating.updated}</div>
            </motion.div>

            {/* Floating Element 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-32 w-48 p-4 bg-white rounded-lg border border-zinc-200 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 rounded bg-zinc-100">
                  <Shield className="w-4 h-4 text-zinc-900" />
                </div>
                <span className="text-sm font-semibold">{t.landing.floating.secure}</span>
              </div>
              <div className="text-xs text-zinc-500">{t.landing.floating.encrypted}</div>
            </motion.div>
          </div>
        </motion.div>

      </main>

      {/* Footer Tech Stack & Company Info */}
      <footer className="py-8 border-t border-zinc-100 mt-auto bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-bold text-zinc-900 mb-2">{t.landing.companyInfo.name}</h4>
              <p className="text-sm text-zinc-500">{t.landing.companyInfo.address}</p>
              <p className="text-sm text-zinc-500">{t.landing.companyInfo.contact}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">{t.landing.footer}</p>
              <div className="flex flex-wrap justify-start md:justify-end gap-4 grayscale opacity-40 hover:opacity-100 transition-opacity">
                <span className="text-sm font-bold">Next.js 15</span>
                <span className="text-sm font-bold">React 19</span>
                <span className="text-sm font-bold">TypeScript</span>
                <span className="text-sm font-bold">Supabase</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">{t.landing.companyInfo.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
