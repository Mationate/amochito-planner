import { NextRequest, NextResponse } from 'next/server';
import { cronService, validateTimeFormat, parseTimeString } from '@/lib/cronService';
import { verifyEmailConfig } from '@/lib/emailService';

// GET - Obtener información de notificaciones activas
export async function GET(request: NextRequest) {
  try {
    const activeJobs = cronService.getActiveJobs();
    
    return NextResponse.json({
      success: true,
      activeJobs: activeJobs.length,
      jobs: activeJobs
    });
  } catch (error) {
    console.error('Error obteniendo información de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error obteniendo información de notificaciones' },
      { status: 500 }
    );
  }
}

// POST - Configurar notificación diaria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, time, action } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'schedule': {
        if (!time) {
          return NextResponse.json(
            { error: 'La hora es requerida para programar' },
            { status: 400 }
          );
        }

        // Parsear y validar la hora
        const parsedTime = parseTimeString(time);
        if (!parsedTime) {
          return NextResponse.json(
            { error: 'Formato de hora inválido. Use HH:MM (ej: 08:30)' },
            { status: 400 }
          );
        }

        const { hour, minute } = parsedTime;
        if (!validateTimeFormat(hour, minute)) {
          return NextResponse.json(
            { error: 'Hora inválida. Use formato 24 horas (00:00 - 23:59)' },
            { status: 400 }
          );
        }

        // Verificar configuración de correo antes de programar
        const emailConfigValid = await verifyEmailConfig();
        if (!emailConfigValid) {
          return NextResponse.json(
            { error: 'Configuración de correo inválida. Verifique las variables de entorno EMAIL_USER y EMAIL_PASSWORD' },
            { status: 500 }
          );
        }

        // Programar el cron job
        const jobId = cronService.scheduleDailyEmail(email, hour, minute);
        const started = cronService.startJob(jobId);

        if (started) {
          return NextResponse.json({
            success: true,
            message: `Notificación diaria programada para ${email} a las ${time}`,
            jobId,
            scheduledTime: time
          });
        } else {
          return NextResponse.json(
            { error: 'Error iniciando la notificación programada' },
            { status: 500 }
          );
        }
      }

      case 'test': {
        // Verificar configuración de correo
        const emailConfigValid = await verifyEmailConfig();
        if (!emailConfigValid) {
          return NextResponse.json(
            { error: 'Configuración de correo inválida. Verifique las variables de entorno EMAIL_USER y EMAIL_PASSWORD' },
            { status: 500 }
          );
        }

        // Enviar correo de prueba
        const testSent = await cronService.sendTestEmail(email);
        
        if (testSent) {
          return NextResponse.json({
            success: true,
            message: `Correo de prueba enviado a ${email}`
          });
        } else {
          return NextResponse.json(
            { error: 'Error enviando correo de prueba' },
            { status: 500 }
          );
        }
      }

      case 'stop': {
        const jobId = `daily-email-${email.replace('@', '-at-').replace('.', '-dot-')}`;
        const stopped = cronService.stopJob(jobId);
        
        if (stopped) {
          return NextResponse.json({
            success: true,
            message: `Notificación diaria detenida para ${email}`
          });
        } else {
          return NextResponse.json(
            { error: 'No se encontró notificación activa para este email' },
            { status: 404 }
          );
        }
      }

      case 'remove': {
        const jobId = `daily-email-${email.replace('@', '-at-').replace('.', '-dot-')}`;
        const removed = cronService.removeJob(jobId);
        
        if (removed) {
          return NextResponse.json({
            success: true,
            message: `Notificación eliminada para ${email}`
          });
        } else {
          return NextResponse.json(
            { error: 'No se encontró notificación para este email' },
            { status: 404 }
          );
        }
      }

      default:
        return NextResponse.json(
          { error: 'Acción inválida. Use: schedule, test, stop, o remove' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en endpoint de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Detener todas las notificaciones
export async function DELETE(request: NextRequest) {
  try {
    cronService.stopAllJobs();
    
    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones han sido detenidas'
    });
  } catch (error) {
    console.error('Error deteniendo notificaciones:', error);
    return NextResponse.json(
      { error: 'Error deteniendo notificaciones' },
      { status: 500 }
    );
  }
}