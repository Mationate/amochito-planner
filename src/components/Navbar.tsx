'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Menu, X, Calendar, CalendarDays, Bell, Palette } from 'lucide-react'

interface NavbarProps {
  currentView: 'weekly' | 'monthly' | 'notifications' | 'themes'
  onViewChange: (view: 'weekly' | 'monthly' | 'notifications' | 'themes') => void
}

export default function Navbar({ currentView, onViewChange }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Verificar si hay una preferencia guardada
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-background shadow-sm border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-6">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">WP</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground transition-colors duration-200">
                Weekly Planner
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-muted-foreground transition-colors duration-200">
                Organiza tu semana de manera eficiente
              </p>
            </div>
          </div>

          {/* Controles de escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Botones de vista */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => onViewChange('weekly')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'weekly'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Semanal
              </button>
              <button
                onClick={() => onViewChange('monthly')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'monthly'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Mensual
              </button>
              <button
                onClick={() => onViewChange('notifications')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'notifications'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bell className="w-4 h-4" />
                Alertas
              </button>
              <button
                onClick={() => onViewChange('themes')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'themes'
                    ? 'bg-background text-accent shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Palette className="w-4 h-4" />
                Temas
              </button>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200"
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-accent" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200"
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-accent" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col space-y-3">
              <div className="text-sm text-muted-foreground px-2">
                Organiza tu semana de manera eficiente
              </div>
              
              {/* Botones de vista móvil */}
              <div className="flex flex-col space-y-2 px-2">
                <button
                  onClick={() => {
                    onViewChange('weekly')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentView === 'weekly'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Vista Semanal
                </button>
                <button
                  onClick={() => {
                    onViewChange('monthly')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentView === 'monthly'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Vista Mensual
                </button>
                <button
                  onClick={() => {
                    onViewChange('notifications')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentView === 'notifications'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Configurar Alertas
                </button>
                <button
                  onClick={() => {
                    onViewChange('themes')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentView === 'themes'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Temas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}