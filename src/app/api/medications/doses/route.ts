import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Marcar dosis como tomada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicationId, scheduledTime } = body;

    if (!medicationId || !scheduledTime) {
      return NextResponse.json(
        { error: 'medicationId y scheduledTime son requeridos' },
        { status: 400 }
      );
    }

    // Convertir scheduledTime a Date
    const scheduledDate = new Date(scheduledTime);
    
    // Buscar si ya existe una dosis para esta hora programada
    let dose = await prisma.medicationDose.findFirst({
      where: {
        medicationId,
        scheduledTime: scheduledDate
      }
    });

    if (dose) {
      // Si existe, actualizar takenAt
      dose = await prisma.medicationDose.update({
        where: { id: dose.id },
        data: { takenAt: new Date() }
      });
    } else {
      // Si no existe, crear nueva dosis
      dose = await prisma.medicationDose.create({
        data: {
          medicationId,
          scheduledTime: scheduledDate,
          takenAt: new Date()
        }
      });
    }

    return NextResponse.json(dose, { status: 201 });
  } catch (error) {
    console.error('Error marking dose as taken:', error);
    return NextResponse.json(
      { error: 'Error al marcar dosis como tomada' },
      { status: 500 }
    );
  }
}

// DELETE - Desmarcar dosis (marcar como no tomada)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medicationId = searchParams.get('medicationId');
    const scheduledTime = searchParams.get('scheduledTime');

    if (!medicationId || !scheduledTime) {
      return NextResponse.json(
        { error: 'medicationId y scheduledTime son requeridos' },
        { status: 400 }
      );
    }

    // Convertir scheduledTime a Date
    const scheduledDate = new Date(scheduledTime);
    
    // Buscar la dosis
    const dose = await prisma.medicationDose.findFirst({
      where: {
        medicationId,
        scheduledTime: scheduledDate
      }
    });

    if (dose) {
      // Actualizar takenAt a null (no tomada)
      await prisma.medicationDose.update({
        where: { id: dose.id },
        data: { takenAt: null }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unmarking dose:', error);
    return NextResponse.json(
      { error: 'Error al desmarcar dosis' },
      { status: 500 }
    );
  }
}

// GET - Obtener dosis de un medicamento para un día específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medicationId = searchParams.get('medicationId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!medicationId || !date) {
      return NextResponse.json(
        { error: 'medicationId y date son requeridos' },
        { status: 400 }
      );
    }

    // Crear rango de fechas para el día
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    const doses = await prisma.medicationDose.findMany({
      where: {
        medicationId,
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    return NextResponse.json(doses);
  } catch (error) {
    console.error('Error fetching doses:', error);
    return NextResponse.json(
      { error: 'Error al obtener dosis' },
      { status: 500 }
    );
  }
}