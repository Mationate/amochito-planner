import WeeklyPlanner from '@/components/WeeklyPlanner';

export default function Home() {
  return (
    <div className="space-y-8">
      <WeeklyPlanner />
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Próximas funcionalidades
        </h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Integración con base de datos (Prisma + NeonDB)</li>
          <li>• Sincronización entre dispositivos</li>
          <li>• Categorías y etiquetas para tareas</li>
          <li>• Recordatorios y notificaciones</li>
          <li>• Vista de calendario mensual</li>
          <li>• Exportación de datos</li>
        </ul>
      </div>
    </div>
  );
}