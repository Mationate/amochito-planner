import * as cron from 'node-cron';
import { database } from './database';
import { sendDailyTaskEmail } from './emailService';
import { dateUtils } from './dateUtils';

// Configuración del cron job para envío diario de correos
class CronService {
  private static instance: CronService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {
    // Recuperar configuraciones de notificaciones al inicializar
    this.loadNotificationConfigs();
  }

  // Cargar configuraciones de notificaciones desde la base de datos
  private async loadNotificationConfigs(): Promise<void> {
    try {
      const configs = await database.getAllActiveNotificationConfigs();
      console.log(`📋 Cargando ${configs.length} configuraciones de notificación desde la base de datos`);
      
      for (const config of configs) {
        const { hour, minute } = parseTimeString(config.time) || { hour: 8, minute: 0 };
        const jobId = await this.scheduleDailyEmail(config.email, hour, minute);
        
        // Iniciar el job si está activo
        if (config.isActive) {
          this.startJob(jobId);
          console.log(`▶️ Notificación reactivada para ${config.email} a las ${config.time}`);
        }
      }
    } catch (error) {
      console.error('Error cargando configuraciones de notificación:', error);
    }
  }

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  // Programar envío diario de correos
  public async scheduleDailyEmail(recipientEmail: string, hour: number = 8, minute: number = 0): Promise<string> {
    const jobId = `daily-email-${recipientEmail.replace('@', '-at-').replace('.', '-dot-')}`;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Si ya existe un job para este email, lo detenemos primero
    if (this.jobs.has(jobId)) {
      this.stopJob(jobId);
    }

    // Crear el cron job (se ejecuta todos los días a la hora especificada)
    const task = cron.schedule(`${minute} ${hour} * * *`, async () => {
      console.log(`🕐 Ejecutando envío diario de correo para ${recipientEmail} a las ${hour}:${minute.toString().padStart(2, '0')}`);
      
      try {
        // Obtener la fecha de hoy
        const today = dateUtils.formatDate(new Date());
        
        // Obtener las tareas del día actual que no están completadas
        const todayTasks = await database.getTasksByDate(today);
        const pendingTasks = todayTasks.filter(task => !task.completed);
        
        console.log(`📋 Encontradas ${pendingTasks.length} tareas pendientes para hoy`);
        
        // Enviar el correo
        const emailSent = await sendDailyTaskEmail(pendingTasks, recipientEmail);
        
        if (emailSent) {
          console.log(`✅ Correo diario enviado exitosamente a ${recipientEmail}`);
        } else {
          console.error(`❌ Error enviando correo diario a ${recipientEmail}`);
        }
      } catch (error) {
        console.error('❌ Error en el cron job de envío diario:', error);
      }
    }, {
      timezone: 'America/Santiago' // Ajusta según tu zona horaria
    });
    
    // No iniciar automáticamente
    task.stop();

    this.jobs.set(jobId, task);
    
    // Guardar o actualizar la configuración en la base de datos
    try {
      const existingConfig = await database.getNotificationConfig(recipientEmail);
      
      if (existingConfig) {
        // Actualizar configuración existente
        await database.updateNotificationConfig(recipientEmail, {
          time: timeString,
          jobId: jobId,
          isActive: true
        });
        console.log(`🔄 Configuración de notificación actualizada para ${recipientEmail}`);
      } else {
        // Crear nueva configuración
        await database.createNotificationConfig(recipientEmail, timeString, jobId);
        console.log(`✅ Nueva configuración de notificación creada para ${recipientEmail}`);
      }
    } catch (error) {
      console.error('Error guardando configuración de notificación:', error);
    }
    
    console.log(`📅 Cron job programado: ${jobId} para las ${hour}:${minute.toString().padStart(2, '0')} diariamente`);
    
    return jobId;
  }

  // Iniciar un job específico
  public startJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.start();
      console.log(`▶️ Cron job iniciado: ${jobId}`);
      return true;
    }
    console.error(`❌ Cron job no encontrado: ${jobId}`);
    return false;
  }

  // Detener un job específico
  public async stopJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      
      // Desactivar en la base de datos
      try {
        const configs = await database.getAllActiveNotificationConfigs();
        const config = configs.find(c => c.jobId === jobId);
        if (config) {
          await database.deactivateNotificationConfig(config.email);
          console.log(`🔄 Configuración desactivada para ${config.email}`);
        }
      } catch (error) {
        console.error('Error desactivando configuración en la base de datos:', error);
      }
      
      console.log(`⏹️ Cron job detenido: ${jobId}`);
      return true;
    }
    console.error(`❌ Cron job no encontrado: ${jobId}`);
    return false;
  }

  // Eliminar un job
  public async removeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.destroy();
      this.jobs.delete(jobId);
      
      // Eliminar de la base de datos
      try {
        const configs = await database.getAllActiveNotificationConfigs();
        const config = configs.find(c => c.jobId === jobId);
        if (config) {
          await database.deleteNotificationConfig(config.email);
          console.log(`🗑️ Configuración eliminada de la base de datos para ${config.email}`);
        }
      } catch (error) {
        console.error('Error eliminando configuración de la base de datos:', error);
      }
      
      console.log(`🗑️ Cron job eliminado: ${jobId}`);
      return true;
    }
    console.error(`❌ Cron job no encontrado: ${jobId}`);
    return false;
  }

  // Detener notificación por email específico
  public async stopNotificationByEmail(email: string): Promise<boolean> {
    try {
      const config = await database.getNotificationConfig(email);
      if (config && config.jobId) {
        const success = await this.stopJob(config.jobId);
        if (success) {
          console.log(`🔄 Notificación detenida para ${email}`);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error deteniendo notificación por email:', error);
      return false;
    }
  }

  // Obtener todos los jobs activos
  public async getActiveJobs(): Promise<string[]> {
    try {
      const configs = await database.getAllActiveNotificationConfigs();
      return configs.map(config => config.jobId || `daily-email-${config.email.replace('@', '-at-').replace('.', '-dot-')}`);
    } catch (error) {
      console.error('Error obteniendo trabajos activos desde la base de datos:', error);
      // Fallback a la implementación en memoria
      return Array.from(this.jobs.keys()).filter(jobId => {
        const job = this.jobs.get(jobId);
        return job && job.getStatus() === 'scheduled';
      });
    }
  }

  public async getActiveJobsCount(): Promise<number> {
    try {
      const configs = await database.getAllActiveNotificationConfigs();
      return configs.length;
    } catch (error) {
      console.error('Error obteniendo conteo de trabajos activos:', error);
      return 0;
    }
  }

  // Obtener información de un job
  public getJobInfo(jobId: string): { exists: boolean; running: boolean; nextExecution?: Date } | null {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      exists: true,
      running: job.getStatus() === 'scheduled',
      // Note: node-cron no proporciona nextExecution directamente
    };
  }

  // Programar un envío de prueba inmediato
  public async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      console.log(`🧪 Enviando correo de prueba a ${recipientEmail}`);
      
      // Obtener la fecha de hoy
      const today = dateUtils.formatDate(new Date());
      
      // Obtener las tareas del día actual que no están completadas
      const todayTasks = await database.getTasksByDate(today);
      const pendingTasks = todayTasks.filter(task => !task.completed);
      
      console.log(`📋 Encontradas ${pendingTasks.length} tareas pendientes para el correo de prueba`);
      
      // Enviar el correo
      const emailSent = await sendDailyTaskEmail(pendingTasks, recipientEmail);
      
      if (emailSent) {
        console.log(`✅ Correo de prueba enviado exitosamente a ${recipientEmail}`);
        return true;
      } else {
        console.error(`❌ Error enviando correo de prueba a ${recipientEmail}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error enviando correo de prueba:', error);
      return false;
    }
  }

  // Detener todos los jobs
  public async stopAllJobs(): Promise<void> {
    try {
      // Desactivar todas las configuraciones en la base de datos
      const configs = await database.getAllActiveNotificationConfigs();
      for (const config of configs) {
        await database.deactivateNotificationConfig(config.email);
      }
      
      // Detener todos los jobs en memoria
      this.jobs.forEach((job, jobId) => {
        job.stop();
        console.log(`⏹️ Cron job detenido: ${jobId}`);
      });
      
      console.log('🛑 Todos los cron jobs han sido detenidos y desactivados en la base de datos');
    } catch (error) {
      console.error('Error deteniendo todos los jobs:', error);
      // Fallback: detener solo los jobs en memoria
      this.jobs.forEach((job, jobId) => {
        job.stop();
        console.log(`⏹️ Cron job detenido: ${jobId}`);
      });
    }
  }

  // Iniciar todos los jobs
  public startAllJobs(): void {
    this.jobs.forEach((job, jobId) => {
      job.start();
      console.log(`▶️ Cron job iniciado: ${jobId}`);
    });
    console.log('▶️ Todos los cron jobs han sido iniciados');
  }
}

// Exportar la instancia singleton
export const cronService = CronService.getInstance();

// Función de utilidad para validar formato de hora
export const validateTimeFormat = (hour: number, minute: number): boolean => {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

// Función de utilidad para parsear tiempo desde string "HH:MM"
export const parseTimeString = (timeString: string): { hour: number; minute: number } | null => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  const match = timeString.match(timeRegex);
  
  if (!match) {
    return null;
  }
  
  return {
    hour: parseInt(match[1], 10),
    minute: parseInt(match[2], 10)
  };
};