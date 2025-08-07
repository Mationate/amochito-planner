'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
// Removed Alert import - using simple div for messages
import { Bell, Mail, Clock, CheckCircle, XCircle, Send, Settings } from 'lucide-react';

interface NotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  jobId?: string;
  scheduledTime?: string;
  activeJobs?: number;
  jobs?: string[];
}

export default function NotificationSettings() {
  const [email, setEmail] = useState('');
  const [time, setTime] = useState('08:00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const [isScheduled, setIsScheduled] = useState(false);

  // Cargar información de notificaciones activas al montar el componente
  useEffect(() => {
    loadNotificationInfo();
  }, []);

  const loadNotificationInfo = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        const jobCount = data.activeJobs || 0;
        setActiveJobs(jobCount);
        setIsScheduled(jobCount > 0);
        console.log(`Notificaciones activas: ${jobCount}`);
      } else {
        console.error('Error en la respuesta:', data.error);
        setActiveJobs(0);
        setIsScheduled(false);
      }
    } catch (error) {
      console.error('Error cargando información de notificaciones:', error);
      setActiveJobs(0);
      setIsScheduled(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleScheduleNotification = async () => {
    if (!email.trim()) {
      showMessage('error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          time,
          action: 'schedule'
        }),
      });

      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Notificación programada exitosamente');
        // Actualizar el estado inmediatamente y luego recargar
        await loadNotificationInfo();
      } else {
        showMessage('error', data.error || 'Error programando la notificación');
      }
    } catch (error) {
      showMessage('error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email.trim()) {
      showMessage('error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'test'
        }),
      });

      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Correo de prueba enviado');
      } else {
        showMessage('error', data.error || 'Error enviando correo de prueba');
      }
    } catch (error) {
      showMessage('error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopNotification = async () => {
    if (!email.trim()) {
      showMessage('error', 'Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'stop'
        }),
      });

      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Notificación detenida');
        // Actualizar el estado después de detener
        await loadNotificationInfo();
      } else {
        showMessage('error', data.error || 'Error deteniendo la notificación');
      }
    } catch (error) {
      showMessage('error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAllNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        showMessage('success', data.message || 'Todas las notificaciones detenidas');
        // Actualizar el estado después de detener todas
        await loadNotificationInfo();
      } else {
        showMessage('error', data.error || 'Error deteniendo las notificaciones');
      }
    } catch (error) {
      showMessage('error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Bell className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notificaciones Diarias
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Recibe un correo cada mañana con tus tareas del día
        </p>
      </div>

      {/* Estado Actual */}
      <Card className={`border-2 ${isScheduled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isScheduled ? (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <span className="text-green-700 font-semibold text-lg">Sistema Activo</span>
                      <p className="text-green-600 text-sm">Las notificaciones están funcionando correctamente</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <XCircle className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold text-lg">Sistema Inactivo</span>
                      <p className="text-gray-500 text-sm">No hay notificaciones programadas</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Notificaciones Programadas:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    activeJobs > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {activeJobs}
                  </span>
                  <Bell className={`h-5 w-5 ${
                    activeJobs > 0 ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              {activeJobs > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Recibirás un correo diario con tus tareas pendientes
                </p>
              )}
              {activeJobs === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Configura una notificación para recibir recordatorios diarios
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurar Notificación
          </CardTitle>
          <CardDescription>
            Configura tu email y la hora para recibir las notificaciones diarias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora de Envío
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              El correo se enviará todos los días a esta hora
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleScheduleNotification}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              {loading ? 'Programando...' : 'Programar Notificación'}
            </Button>
            
            <Button
              onClick={handleTestEmail}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Prueba'}
            </Button>
          </div>

          {isScheduled && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={handleStopNotification}
                disabled={loading}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Detener Mi Notificación
              </Button>
              
              <Button
                onClick={handleStopAllNotifications}
                disabled={loading}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Detener Todas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              📧 Configuración de Correo
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>Para que funcione:</strong> Necesitas configurar las variables de entorno:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">EMAIL_USER</code>: Tu email de Gmail</li>
                <li><code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">EMAIL_PASSWORD</code>: Tu contraseña de aplicación de Gmail</li>
              </ul>
              <p className="text-xs">
                💡 <strong>Tip:</strong> Para Gmail, necesitas generar una "contraseña de aplicación" en tu configuración de seguridad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  );
}