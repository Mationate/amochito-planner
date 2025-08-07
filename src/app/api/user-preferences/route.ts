import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// GET - Obtener preferencias de usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const preferences = await database.getUserPreferences(userId);
    
    // Si no existen preferencias, crear unas por defecto
    if (!preferences) {
      const newPreferences = await database.createUserPreferences(userId);
      return NextResponse.json(newPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar preferencias de usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, theme, colorTheme } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const updates: { theme?: string; colorTheme?: string } = {};
    if (theme) updates.theme = theme;
    if (colorTheme) updates.colorTheme = colorTheme;

    const preferences = await database.updateUserPreferences(userId, updates);
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'Error actualizando preferencias' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar preferencias de usuario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const success = await database.deleteUserPreferences(userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error eliminando preferencias' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Preferencias eliminadas correctamente' });
  } catch (error) {
    console.error('Error eliminando preferencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}