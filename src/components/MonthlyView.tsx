'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, BarChart3 } from 'lucide-react'
import { Task } from '@/types'

interface MonthlyViewProps {
  onBackToWeekly?: () => void
}

export default function MonthlyView({ onBackToWeekly }: MonthlyViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [monthStats, setMonthStats] = useState({
    totalCompleted: 0,
    byCategory: {} as Record<string, number>,
    byDay: {} as Record<string, number>
  })

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  // Obtener tareas completadas del mes actual
  const fetchCompletedTasks = async () => {
    console.log('MonthlyView: fetchCompletedTasks called')
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      const url = `/api/tasks?monthStart=${startDate.toISOString().split('T')[0]}&monthEnd=${endDate.toISOString().split('T')[0]}&completed=true`
      console.log('MonthlyView: Fetching URL:', url)
      
      const response = await fetch(url)
      
      if (response.ok) {
        const tasks = await response.json()
        setCompletedTasks(tasks)
        calculateStats(tasks)
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas del mes
  const calculateStats = (tasks: Task[]) => {
    const byCategory: Record<string, number> = {}
    const byDay: Record<string, number> = {}
    
    tasks.forEach(task => {
      // Por categoría
      const category = task.category || 'Sin categoría'
      byCategory[category] = (byCategory[category] || 0) + 1
      
      // Por día
      const day = new Date(task.date).getDate().toString()
      byDay[day] = (byDay[day] || 0) + 1
    })
    
    setMonthStats({
      totalCompleted: tasks.length,
      byCategory,
      byDay
    })
  }

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Generar días del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0]
      const isCurrentMonth = current.getMonth() === month
      const tasksForDay = completedTasks.filter(task => task.date === dateStr)
      
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth,
        tasks: tasksForDay,
        dayNumber: current.getDate()
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  // Obtener días del mes con tareas
  const getDaysWithTasks = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    
    const days = []
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = completedTasks.filter(task => 
        new Date(task.date).getDate() === day
      )
      days.push({ day, tasks: dayTasks })
    }
    
    return days
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  useEffect(() => {
    fetchCompletedTasks()
  }, [currentDate])

  const calendarDays = generateCalendarDays()
  const completedTasksCount = completedTasks.length

  const categoryColors = {
    'Trabajo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Personal': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Salud': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Educación': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Sin categoría': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          {onBackToWeekly && (
            <button
              onClick={onBackToWeekly}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Vista Semanal
            </button>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vista Mensual
            </h1>
          </div>
        </div>
        
        {/* Navegación de mes */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 capitalize min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Estadísticas del mes */}
          <div className="lg:col-span-1 space-y-6">
            {/* Total de tareas completadas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tareas Completadas
                </h3>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {monthStats.totalCompleted}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Este mes
              </p>
            </div>

            {/* Por categoría */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Por Categoría
                </h3>
              </div>
              <div className="space-y-3">
                {Object.entries(monthStats.byCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      categoryColors[category as keyof typeof categoryColors] || categoryColors['Sin categoría']
                    }`}>
                      {category}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendario del mes */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Calendario de Tareas Completadas
                </h3>
              </div>
              
              {/* Días de la semana */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
                {dayNames.map(day => (
                  <div key={day} className="p-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Días del mes */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 ${
                      day.isCurrentMonth 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      day.isCurrentMonth 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {day.dayNumber}
                    </div>
                    
                    {/* Tasks for this day */}
                    <div className="space-y-1">
                      {day.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="text-xs p-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 truncate"
                          title={`${task.title} - ${task.category} (${task.priority})`}
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      ))}
                      {day.tasks.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{day.tasks.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tasks Summary */}
            {completedTasks.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Resumen de Tareas Completadas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(task.date + 'T00:00:00').toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short'
                            })} • {task.category}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                           task.priority === 'high' 
                             ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                           task.priority === 'medium' 
                             ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                           'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                         }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}