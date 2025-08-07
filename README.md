# Weekly Planner 📅

Una plataforma web completa para planificar tu semana de manera eficiente con persistencia en base de datos y sistema de notificaciones por email.

## 🚀 Características Principales

- **📋 Planner Semanal**: Organiza tus tareas por días de la semana con drag & drop
- **🎯 Gestión Avanzada**: Agrega, edita, completa y elimina tareas con categorías y prioridades
- **💾 Base de Datos**: Persistencia completa con PostgreSQL y Prisma ORM
- **📊 Estadísticas en Tiempo Real**: Progreso semanal con métricas detalladas
- **📧 Notificaciones por Email**: Sistema de alertas diarias automáticas
- **📱 Vista Mensual**: Calendario completo con navegación por meses
- **🎨 Interfaz Moderna**: Diseño responsivo con modo oscuro
- **🔒 TypeScript**: Código completamente tipado para máxima robustez

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15.1.6** - Framework de React con App Router
- **TypeScript 5** - Tipado estático completo
- **Tailwind CSS 3** - Framework de estilos utilitarios
- **Radix UI** - Componentes accesibles y modernos
- **Lucide React** - Librería de iconos
- **@dnd-kit** - Sistema de drag and drop

### Backend & Base de Datos
- **Prisma 6.13.0** - ORM moderno para TypeScript
- **PostgreSQL** - Base de datos relacional (NeonDB)
- **Next.js API Routes** - Endpoints RESTful

### Notificaciones
- **Nodemailer** - Envío de emails
- **node-cron** - Programación de tareas automáticas
- **Gmail SMTP** - Servicio de correo configurado

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- Base de datos PostgreSQL (recomendado: NeonDB)
- Cuenta de Gmail para notificaciones (opcional)

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd weekly-planner
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus configuraciones:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="tu-email@gmail.com"
   EMAIL_PASS="tu-app-password"
   EMAIL_FROM="tu-email@gmail.com"
   ```

4. **Configurar la base de datos**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── notifications/   # API de notificaciones por email
│   │   └── tasks/          # API CRUD de tareas
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal con navegación
│   └── page.tsx            # Página de inicio
├── components/
│   ├── WeeklyPlanner.tsx   # Planner semanal con drag & drop
│   ├── MonthlyView.tsx     # Vista de calendario mensual
│   ├── NotificationSettings.tsx # Configuración de alertas
│   ├── Navbar.tsx          # Barra de navegación
│   └── ui/                 # Componentes de UI reutilizables
├── lib/
│   ├── database.ts         # Funciones de base de datos
│   ├── emailService.ts     # Servicio de envío de emails
│   ├── cronService.ts      # Programación de tareas
│   ├── dateUtils.ts        # Utilidades de fechas
│   └── prisma.ts           # Cliente de Prisma
└── types/
    └── index.ts            # Definiciones de tipos TypeScript
```

## 🎯 Funcionalidades Implementadas

### 📋 Gestión Completa de Tareas
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar tareas
- ✅ **Categorización**: 9 categorías (Trabajo, Estudio, Finanzas, Salud, etc.)
- ✅ **Prioridades**: Sistema de 4 niveles (Baja, Media, Alta, Urgente)
- ✅ **Drag & Drop**: Mover tareas entre días arrastrando
- ✅ **Edición Inline**: Modificar título y categoría directamente
- ✅ **Estados Visuales**: Indicadores claros de tareas completadas

### 📊 Dashboard y Estadísticas
- ✅ **Métricas en Tiempo Real**: Total, completadas, pendientes
- ✅ **Porcentaje de Progreso**: Visualización del avance semanal
- ✅ **Navegación Temporal**: Cambio entre semanas con botones
- ✅ **Indicador de Día Actual**: Destacado visual del día presente

### 📅 Vistas Múltiples
- ✅ **Vista Semanal**: Planner principal con 7 días
- ✅ **Vista Mensual**: Calendario completo navegable
- ✅ **Navegación Fluida**: Cambio entre vistas sin perder contexto

### 📧 Sistema de Notificaciones
- ✅ **Alertas Diarias**: Emails automáticos con tareas pendientes
- ✅ **Configuración Flexible**: Hora personalizable para envío
- ✅ **Email de Prueba**: Función para probar configuración
- ✅ **Gestión de Trabajos**: Iniciar, detener y monitorear alertas
- ✅ **Estado Visual**: Dashboard del sistema de notificaciones

### 💾 Persistencia y Base de Datos
- ✅ **PostgreSQL**: Base de datos robusta con NeonDB
- ✅ **Prisma ORM**: Queries tipadas y migraciones automáticas
- ✅ **API RESTful**: Endpoints completos para todas las operaciones
- ✅ **Sincronización**: Datos consistentes entre sesiones y dispositivos

### 🎨 Experiencia de Usuario
- ✅ **Diseño Responsivo**: Funciona en desktop, tablet y móvil
- ✅ **Modo Oscuro**: Tema oscuro completo
- ✅ **Feedback Visual**: Toasts y animaciones para acciones
- ✅ **Navegación Intuitiva**: Barra de navegación con indicadores activos
- ✅ **Carga Optimizada**: Estados de loading y manejo de errores

## 🔮 Futuras Mejoras

### 🚀 **Funcionalidades Avanzadas**
- 🔄 **Subtareas**: Sistema de tareas anidadas con dependencias
- ⏰ **Fechas de Vencimiento**: Deadlines con alertas automáticas
- 🔁 **Tareas Recurrentes**: Repetición automática (diaria, semanal, mensual)
- 🏷️ **Etiquetas Personalizadas**: Sistema de tags flexible
- 📎 **Archivos Adjuntos**: Subir documentos y enlaces a tareas
- ⏱️ **Tracking de Tiempo**: Cronómetro integrado para productividad

### 📊 **Analytics y Reportes**
- 📈 **Dashboard de Productividad**: Métricas históricas y tendencias
- 📋 **Reportes Semanales/Mensuales**: Análisis detallado de rendimiento
- 🎯 **Objetivos y Metas**: Sistema de goals con seguimiento
- 📊 **Gráficos Interactivos**: Visualización avanzada de datos
- 🏆 **Sistema de Logros**: Gamificación para motivar productividad

### 📱 **Experiencia Móvil**
- 📲 **PWA (Progressive Web App)**: Instalación como app nativa
- 🔔 **Notificaciones Push**: Alertas en tiempo real en el dispositivo
- 📱 **App Móvil Nativa**: Versiones para iOS y Android
- 🔄 **Sincronización Offline**: Funcionamiento sin conexión

### 🤝 **Colaboración**
- 👥 **Equipos y Workspaces**: Espacios compartidos de trabajo
- 💬 **Comentarios**: Sistema de notas colaborativas
- 🔗 **Compartir Tareas**: Enlaces públicos para tareas específicas
- 👤 **Perfiles de Usuario**: Personalización y configuraciones avanzadas

### 🔧 **Integraciones**
- 📅 **Google Calendar**: Sincronización bidireccional
- 📧 **Outlook Integration**: Conectar con Microsoft 365
- 🔗 **Zapier/IFTTT**: Automatizaciones con otras apps
- 📱 **Slack/Discord**: Notificaciones en canales de equipo
- 🗂️ **Notion/Obsidian**: Exportación a sistemas de notas

### 🎨 **Personalización**
- 🎨 **Temas Personalizados**: Colores y estilos configurables
- 🖼️ **Fondos Personalizados**: Imágenes de fondo para el planner
- 🔧 **Widgets Configurables**: Dashboard personalizable
- 🌍 **Internacionalización**: Soporte para múltiples idiomas

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres contribuir al proyecto:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abre** un Pull Request

### 📋 Guidelines para Contribuir
- Sigue las convenciones de código existentes
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación si es necesario
- Asegúrate de que todos los tests pasen

### 🐛 Reportar Bugs
Si encuentras un bug, por favor abre un issue con:
- Descripción detallada del problema
- Pasos para reproducir el bug
- Screenshots si es aplicable
- Información del navegador/sistema operativo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para mejorar la productividad personal y profesional.

---

⭐ **¡Si te gusta el proyecto, no olvides darle una estrella!** ⭐