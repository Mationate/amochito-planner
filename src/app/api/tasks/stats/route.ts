import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');

    let tasks;
    if (weekStart) {
      tasks = await database.getTasksByWeek(weekStart);
    } else {
      tasks = await database.getTasks();
    }

    const stats = await database.getTaskStats(tasks);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task stats' },
      { status: 500 }
    );
  }
}