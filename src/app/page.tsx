'use client'

import { useState } from 'react'
import WeeklyPlanner from '@/components/WeeklyPlanner'
import MonthlyView from '@/components/MonthlyView'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [currentView, setCurrentView] = useState<'weekly' | 'monthly'>('weekly')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      <main className="max-w-7xl">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'weekly' ? (
            <WeeklyPlanner />
          ) : (
            <MonthlyView onBackToWeekly={() => setCurrentView('weekly')} />
          )}
        </div>
      </main>
    </div>
  )
}