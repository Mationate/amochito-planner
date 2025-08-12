import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MedicationSchedule } from '@/types';

// Función helper para calcular la próxima dosis
function calculateNextDose(startTime: string, intervalHours: number): Date {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Crear fecha de inicio para hoy
  const startToday = new Date();
  startToday.setHours(hours, minutes, 0, 0);
  
  // Si ya pasó la hora de inicio de hoy, calcular desde la próxima dosis
  let nextDose = new Date(startToday);
  
  // Mientras la próxima dosis sea en el pasado, agregar el intervalo
  while (nextDose <= now) {
    nextDose.setHours(nextDose.getHours() + intervalHours);
  }
  
  return nextDose;
}

// Función helper para formatear tiempo restante
function formatTimeUntilNext(nextDose: Date): string {
  const now = new Date();
  const diffMs = nextDose.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Ahora';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Función helper para verificar si está atrasado
function isOverdue(startTime: string, intervalHours: number): boolean {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Crear fecha de la última dosis programada
  const lastScheduled = new Date();
  lastScheduled.setHours(hours, minutes, 0, 0);
  
  // Encontrar la última dosis que debería haberse tomado
  while (lastScheduled.getTime() + (intervalHours * 60 * 60 * 1000) <= now.getTime()) {
    lastScheduled.setHours(lastScheduled.getHours() + intervalHours);
  }
  
  // Si la última dosis programada fue hace más de 30 minutos, está atrasado
  const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));
  return lastScheduled <= thirtyMinutesAgo;
}

// GET - Obtener horario de medicamentos
export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      where: { isActive: true },
      orderBy: { startTime: 'asc' }
    });
    
    const schedule: MedicationSchedule[] = await Promise.all(
      medications.map(async medication => {
        const nextDose = calculateNextDose(medication.startTime, medication.intervalHours);
        const timeUntilNext = formatTimeUntilNext(nextDose);
        const overdue = isOverdue(medication.startTime, medication.intervalHours);
        
        // Verificar si esta dosis específica ya fue tomada
        // Buscar dosis en un rango de ±30 minutos de la hora programada
        const startRange = new Date(nextDose.getTime() - 30 * 60 * 1000);
        const endRange = new Date(nextDose.getTime() + 30 * 60 * 1000);
        
        const existingDose = await prisma.medicationDose.findFirst({
          where: {
            medicationId: medication.id,
            scheduledTime: {
              gte: startRange,
              lte: endRange
            }
          }
        });
        
        const isTaken = existingDose?.takenAt !== null;
        
        return {
          medication: {
            ...medication,
            notes: medication.notes || undefined,
            createdAt: new Date(medication.createdAt),
            updatedAt: new Date(medication.updatedAt)
          },
          nextDose,
          isOverdue: overdue,
          timeUntilNext,
          isTaken,
          doseId: existingDose?.id
        };
      })
    );
    
    // Ordenar por prioridad: primero los atrasados, luego por tiempo hasta la próxima dosis
    schedule.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.nextDose.getTime() - b.nextDose.getTime();
    });
    
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching medication schedule:', error);
    return NextResponse.json(
      { error: 'Error al obtener horario de medicamentos' },
      { status: 500 }
    );
  }
}