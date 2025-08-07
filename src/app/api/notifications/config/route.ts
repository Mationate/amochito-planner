import { NextRequest, NextResponse } from 'next/server';
import * as database from '@/lib/database';

// GET - Obtener configuraciones de notificación por email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const config = await database.getNotificationConfig(email);
    
    if (!config) {
      return NextResponse.json({
        success: true,
        config: null,
        message: 'No hay configuración para este email'
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        email: config.email,
        time: config.time,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Error obteniendo configuración de notificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET all active configurations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'getAllActive') {
      const configs = await database.getAllActiveNotificationConfigs();
      
      return NextResponse.json({
        success: true,
        configs: configs.map((config: any) => ({
          email: config.email,
          time: config.time,
          isActive: config.isActive,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }))
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error procesando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}