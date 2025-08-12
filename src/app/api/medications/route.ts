import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Medication } from '@/types';

// GET - Obtener todos los medicamentos
export async function GET() {
  try {
    const medications = await prisma.medication.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json(
      { error: 'Error al obtener medicamentos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo medicamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dosage, intervalHours, startTime, notes } = body;

    if (!name || !dosage || !intervalHours || !startTime) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de hora (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'Formato de hora inválido. Use HH:MM' },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.create({
      data: {
        name: name.trim(),
        dosage: dosage.trim(),
        intervalHours: parseInt(intervalHours),
        startTime: startTime.trim(),
        notes: notes?.trim() || null
      }
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Error creating medication:', error);
    return NextResponse.json(
      { error: 'Error al crear medicamento' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar medicamento
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, dosage, intervalHours, startTime, notes, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del medicamento requerido' },
        { status: 400 }
      );
    }

    // Validar formato de hora si se proporciona
    if (startTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return NextResponse.json(
          { error: 'Formato de hora inválido. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (dosage !== undefined) updateData.dosage = dosage.trim();
    if (intervalHours !== undefined) updateData.intervalHours = parseInt(intervalHours);
    if (startTime !== undefined) updateData.startTime = startTime.trim();
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const medication = await prisma.medication.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Error updating medication:', error);
    return NextResponse.json(
      { error: 'Error al actualizar medicamento' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar medicamento (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del medicamento requerido' },
        { status: 400 }
      );
    }

    await prisma.medication.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication:', error);
    return NextResponse.json(
      { error: 'Error al eliminar medicamento' },
      { status: 500 }
    );
  }
}