# Weekly Planner 📅

Una plataforma web intuitiva y atractiva para planificar tu semana de manera eficiente.

## 🚀 Características

- **Planner Semanal**: Organiza tus tareas por días de la semana
- **Gestión de Tareas**: Agrega, edita, completa y elimina tareas fácilmente
- **Persistencia Local**: Tus datos se guardan automáticamente en el navegador
- **Estadísticas**: Ve tu progreso semanal con métricas en tiempo real
- **Interfaz Intuitiva**: Diseño moderno y responsivo con Tailwind CSS
- **TypeScript**: Código tipado para mayor robustez

## 🛠️ Stack Tecnológico

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Lucide React** - Iconos modernos
- **Local Storage** - Persistencia básica

## 🏃‍♂️ Inicio Rápido

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── globals.css      # Estilos globales
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página de inicio
├── components/
│   └── WeeklyPlanner.tsx # Componente principal del planner
├── lib/
│   └── storage.ts       # Utilidades de almacenamiento
└── types/
    └── index.ts         # Definiciones de tipos TypeScript
```

## 🎯 Funcionalidades Actuales

### Gestión de Tareas
- ✅ Crear tareas para días específicos
- ✅ Marcar tareas como completadas
- ✅ Editar títulos de tareas
- ✅ Eliminar tareas
- ✅ Vista organizada por días de la semana

### Estadísticas
- ✅ Total de tareas
- ✅ Tareas completadas
- ✅ Tareas pendientes
- ✅ Porcentaje de progreso

### Persistencia
- ✅ Almacenamiento automático en Local Storage
- ✅ Carga automática al iniciar la aplicación

## 🔮 Próximas Funcionalidades

- 🔄 **Integración con Base de Datos**
  - Prisma ORM
  - NeonDB (PostgreSQL)
  - Sincronización entre dispositivos

- 📊 **Funcionalidades Avanzadas**
  - Categorías y etiquetas
  - Niveles de prioridad
  - Fechas de vencimiento
  - Recordatorios

- 🎨 **Mejoras de UI/UX**
  - Modo oscuro
  - Drag & drop para reordenar
  - Vista de calendario mensual
  - Animaciones suaves

- 📱 **Características Adicionales**
  - PWA (Progressive Web App)
  - Notificaciones push
  - Exportación de datos
  - Plantillas de tareas

## 🏗️ Preparación para Base de Datos

El proyecto está estructurado para facilitar la futura integración con Prisma y NeonDB:

```typescript
// Estructura de datos preparada para Prisma
interface Task {
  id: string;          // UUID para compatibilidad con DB
  title: string;
  description?: string;
  completed: boolean;
  day: WeekDay;
  priority: Priority;
  createdAt: Date;     // Timestamps para auditoría
  updatedAt: Date;
}
```

### Migración Futura a Base de Datos

1. **Configurar Prisma**:
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

2. **Definir Schema**:
   ```prisma
   model Task {
     id          String   @id @default(cuid())
     title       String
     description String?
     completed   Boolean  @default(false)
     day         String
     priority    String   @default("medium")
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
   ```

3. **Reemplazar funciones de storage** con llamadas a API

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

**¡Organiza tu semana de manera eficiente! 🎯**