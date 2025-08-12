'use client'

import { useState } from 'react'
import WeeklyPlanner from '@/components/WeeklyPlanner'
import MonthlyView from '@/components/MonthlyView'
import NotificationSettings from '@/components/NotificationSettings'
import ThemeSettings from '@/components/ThemeSettings'
import MedicationTracker from '@/components/MedicationTracker'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [currentView, setCurrentView] = useState<'weekly' | 'monthly' | 'notifications' | 'themes'>('weekly')
  const [medicationExpanded, setMedicationExpanded] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Medication Tracker - Always visible */}
          <MedicationTracker 
            isExpanded={medicationExpanded} 
            onToggle={() => setMedicationExpanded(!medicationExpanded)} 
          />
          
          {/* Main Content */}
          {currentView === 'weekly' ? (
            <WeeklyPlanner />
          ) : currentView === 'monthly' ? (
            <MonthlyView onBackToWeekly={() => setCurrentView('weekly')} />
          ) : currentView === 'notifications' ? (
            <NotificationSettings />
          ) : (
            <ThemeSettings />
          )}
        </div>
      </main>
    </div>
  )
}