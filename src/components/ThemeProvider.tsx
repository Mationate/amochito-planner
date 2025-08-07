'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red' | 'indigo'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorTheme?: ColorTheme
  userId?: string // ID único del usuario para persistencia en DB
}

type ThemeProviderState = {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  isLoading: boolean
}

const initialState: ThemeProviderState = {
  theme: 'system',
  colorTheme: 'default',
  setTheme: () => null,
  setColorTheme: () => null,
  isLoading: true,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'default',
  userId = 'default-user', // ID por defecto si no se proporciona
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [colorTheme, setColorTheme] = useState<ColorTheme>(defaultColorTheme)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar preferencias desde la base de datos
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch(`/api/user-preferences?userId=${userId}`);
        if (response.ok) {
          const preferences = await response.json();
          setTheme(preferences.theme as Theme);
          setColorTheme(preferences.colorTheme as ColorTheme);
        }
      } catch (error) {
        console.error('Error cargando preferencias:', error);
        // Fallback a localStorage si falla la API
        const storedTheme = localStorage.getItem('theme') as Theme;
        const storedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;
        if (storedTheme) setTheme(storedTheme);
        if (storedColorTheme) setColorTheme(storedColorTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, [userId])

  useEffect(() => {
    if (isLoading) return; // No aplicar temas mientras se cargan las preferencias
    
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Remove existing color theme classes
    root.classList.remove('theme-default', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-pink', 'theme-red', 'theme-indigo')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    // Add color theme class
    root.classList.add(`theme-${colorTheme}`)
  }, [theme, colorTheme, isLoading])

  // Función para actualizar tema en la base de datos
  const updateThemeInDB = async (newTheme: Theme) => {
    try {
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, theme: newTheme })
      });
      // Fallback a localStorage
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error guardando tema:', error);
      localStorage.setItem('theme', newTheme);
    }
  };

  // Función para actualizar color theme en la base de datos
  const updateColorThemeInDB = async (newColorTheme: ColorTheme) => {
    try {
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, colorTheme: newColorTheme })
      });
      // Fallback a localStorage
      localStorage.setItem('colorTheme', newColorTheme);
    } catch (error) {
      console.error('Error guardando color theme:', error);
      localStorage.setItem('colorTheme', newColorTheme);
    }
  };

  const value = {
    theme,
    colorTheme,
    isLoading,
    setTheme: (theme: Theme) => {
      setTheme(theme)
      if (!isLoading) {
        updateThemeInDB(theme)
      }
    },
    setColorTheme: (colorTheme: ColorTheme) => {
      setColorTheme(colorTheme)
      if (!isLoading) {
        updateColorThemeInDB(colorTheme)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}