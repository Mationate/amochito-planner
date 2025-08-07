'use client'

import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react'
import { useState } from 'react'

type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red' | 'indigo'

const COLOR_THEMES = [
  { key: 'default', name: 'Por Defecto', color: '#6366f1', description: 'Tema clásico azul-índigo' },
  { key: 'blue', name: 'Azul', color: '#3b82f6', description: 'Azul profesional' },
  { key: 'green', name: 'Verde', color: '#10b981', description: 'Verde natural' },
  { key: 'purple', name: 'Morado', color: '#8b5cf6', description: 'Morado elegante' },
  { key: 'orange', name: 'Naranja', color: '#f59e0b', description: 'Naranja energético' },
  { key: 'pink', name: 'Rosa', color: '#ec4899', description: 'Rosa vibrante' },
  { key: 'red', name: 'Rojo', color: '#ef4444', description: 'Rojo intenso' },
  { key: 'indigo', name: 'Índigo', color: '#6366f1', description: 'Índigo profundo' },
] as const

export default function ThemeSettings() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()
  


  return (
    <div className="space-y-8">
      {/* Configuración de tema claro/oscuro */}
      <div className="rounded-xl shadow-sm p-6 transition-colors duration-300 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sun className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Modo de Visualización
            </h2>
            <p className="text-sm text-muted-foreground">
              Elige entre tema claro, oscuro o automático
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => setTheme('light')}
            variant={theme === 'light' ? 'default' : 'outline'}
            className={`flex items-center gap-3 p-4 h-auto justify-start transition-all duration-200 ${
              theme === 'light' ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
            }`}
          >
            <Sun className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Claro</div>
              <div className="text-xs opacity-70">Tema diurno</div>
            </div>
            {theme === 'light' && <Check className="w-4 h-4 ml-auto" />}
          </Button>

          <Button
            onClick={() => setTheme('dark')}
            variant={theme === 'dark' ? 'default' : 'outline'}
            className={`flex items-center gap-3 p-4 h-auto justify-start transition-all duration-200 ${
              theme === 'dark' ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
            }`}
          >
            <Moon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Oscuro</div>
              <div className="text-xs opacity-70">Tema nocturno</div>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4 ml-auto" />}
          </Button>

          <Button
            onClick={() => setTheme('system')}
            variant={theme === 'system' ? 'default' : 'outline'}
            className={`flex items-center gap-3 p-4 h-auto justify-start transition-all duration-200 ${
              theme === 'system' ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Sistema</div>
              <div className="text-xs opacity-70">Automático</div>
            </div>
            {theme === 'system' && <Check className="w-4 h-4 ml-auto" />}
          </Button>
        </div>
      </div>

      {/* Configuración de esquema de colores */}
      <div className="rounded-xl shadow-sm p-6 transition-colors duration-300 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Palette className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Esquema de Colores
            </h2>
            <p className="text-sm text-muted-foreground">
              Personaliza los colores de la interfaz
            </p>
          </div>
        </div>



        {/* Color Wheel - Selector de colores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Selecciona tu color favorito
          </h3>
          
          {/* Color wheel circular */}
          <div className="flex flex-wrap justify-center gap-4 p-6 bg-muted/50 rounded-xl">
            {COLOR_THEMES.map((colorThemeOption) => (
              <button
                key={colorThemeOption.key}
                onClick={() => setColorTheme(colorThemeOption.key as ColorTheme)}
                className={`relative group transition-all duration-200 hover:scale-110 ${
                  colorTheme === colorThemeOption.key ? 'scale-110' : 'hover:scale-105'
                }`}
                title={`${colorThemeOption.name} - ${colorThemeOption.description}`}
              >
                <div 
                  className={`w-12 h-12 rounded-full border-4 transition-all duration-200 shadow-lg ${
                    colorTheme === colorThemeOption.key 
                      ? 'border-background shadow-xl ring-4 ring-border' 
                      : 'border-border hover:border-background hover:shadow-xl'
                  }`}
                  style={{ backgroundColor: colorThemeOption.color }}
                >
                  {colorTheme === colorThemeOption.key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={3} />
                    </div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap border shadow-md">
                    {colorThemeOption.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Información del color seleccionado */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-background shadow-md"
                style={{ backgroundColor: COLOR_THEMES.find(t => t.key === colorTheme)?.color }}
              />
              <span className="font-semibold text-foreground">
                {COLOR_THEMES.find(t => t.key === colorTheme)?.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {COLOR_THEMES.find(t => t.key === colorTheme)?.description}
            </p>
          </div>
          
          {/* Componente de prueba para verificar variables CSS */}
          <div className="mt-4 p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-3 text-foreground">
              🧪 Prueba de Variables CSS (debe cambiar de color)
            </h4>
            <div className="space-y-2">
              <div className="h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm font-medium">
                Color Primario (bg-primary)
              </div>
              <div className="h-8 bg-accent rounded flex items-center justify-center text-accent-foreground text-sm font-medium">
                Color Acento (bg-accent)
              </div>
              <button className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium transition-colors">
                Botón con color primario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="rounded-xl p-6 border bg-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-3 text-primary">
          ℹ️ Información sobre Temas
        </h3>
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">💾</span>
            <span><strong>Persistencia:</strong> Tus preferencias se guardan automáticamente</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">🔄</span>
            <span><strong>Sincronización:</strong> Los cambios se aplican instantáneamente</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">🎨</span>
            <span><strong>Personalización:</strong> Cada color afecta botones, enlaces y elementos destacados</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary font-bold">📱</span>
            <span><strong>Responsive:</strong> Los temas se adaptan a todos los dispositivos</span>
          </div>
        </div>
      </div>
    </div>
  )
}