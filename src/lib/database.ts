import { prisma } from './prisma';
import { Task, WeekDay, Priority, Category } from '@/types';
import { dateUtils } from './dateUtils';

// Mapeo de tipos entre Prisma y nuestra aplicación
const mapPrismaTaskToTask = (prismaTask: any): Task => ({
  id: prismaTask.id,
  title: prismaTask.title,
  completed: prismaTask.completed,
  priority: prismaTask.priority.toLowerCase() as Priority,
  category: (prismaTask.category?.toLowerCase() || 'other') as Category,
  day: prismaTask.day as WeekDay,
  date: prismaTask.date,
  createdAt: prismaTask.createdAt,
  updatedAt: prismaTask.updatedAt,
});

const mapTaskToPrismaTask = (task: Partial<Task>) => {
  const prismaTask: any = { ...task };
  if (task.priority) {
    prismaTask.priority = task.priority.toUpperCase();
  }
  if (task.category) {
    prismaTask.category = task.category.toUpperCase();
  }
  // Remover campos que no deben ser actualizados
  delete prismaTask.id;
  delete prismaTask.createdAt;
  delete prismaTask.updatedAt;
  return prismaTask;
};

export const database = {
  // Obtener todas las tareas
  async getTasks(): Promise<Task[]> {
    try {
      const tasks = await prisma.task.findMany({
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      return tasks.map(mapPrismaTaskToTask);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Crear una nueva tarea
  async createTask(title: string, day: WeekDay, date: string, priority: Priority = 'medium', category: Category = 'other'): Promise<Task | null> {
    try {
      const task = await prisma.task.create({
        data: {
          title,
          day,
          date,
          priority: priority.toUpperCase() as any,
          category: category.toUpperCase() as any,
          completed: false,
        }
      });
      return mapPrismaTaskToTask(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  },

  // Actualizar una tarea
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const task = await prisma.task.update({
        where: { id },
        data: mapTaskToPrismaTask(updates)
      });
      return mapPrismaTaskToTask(task);
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  },

  // Eliminar una tarea
  async deleteTask(id: string): Promise<boolean> {
    try {
      await prisma.task.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  },

  // Obtener tareas por fecha
  async getTasksByDate(date: string): Promise<Task[]> {
    try {
      const tasks = await prisma.task.findMany({
        where: { date },
        orderBy: { createdAt: 'asc' }
      });
      return tasks.map(mapPrismaTaskToTask);
    } catch (error) {
      console.error('Error fetching tasks by date:', error);
      return [];
    }
  },

  // Obtener tareas por semana
  async getTasksByWeek(weekStartDate: string): Promise<Task[]> {
    try {
      const weekStart = new Date(weekStartDate);
      const weekEnd = dateUtils.addDays(weekStart, 6);
      
      const tasks = await prisma.task.findMany({
        where: {
          date: {
            gte: dateUtils.formatDate(weekStart),
            lte: dateUtils.formatDate(weekEnd)
          }
        },
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      return tasks.map(mapPrismaTaskToTask);
    } catch (error) {
      console.error('Error fetching tasks by week:', error);
      return [];
    }
  },

  // Alternar estado completado de una tarea
  async toggleTask(id: string): Promise<Task | null> {
    try {
      const currentTask = await prisma.task.findUnique({
        where: { id }
      });
      
      if (!currentTask) return null;
      
      const task = await prisma.task.update({
        where: { id },
        data: { completed: !currentTask.completed }
      });
      return mapPrismaTaskToTask(task);
    } catch (error) {
      console.error('Error toggling task:', error);
      return null;
    }
  },

  // Obtener estadísticas de tareas},

  // Obtener tareas por mes con filtro opcional de completadas
  async getTasksByMonth(monthStart: string, monthEnd: string, completedOnly: boolean = false): Promise<Task[]> {
    try {
      const whereClause: any = {
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      };
      
      if (completedOnly) {
        whereClause.completed = true;
      }
      
      const tasks = await prisma.task.findMany({
        where: whereClause,
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' }
        ]
      });
      return tasks.map(mapPrismaTaskToTask);
    } catch (error) {
      console.error('Error fetching tasks by month:', error);
      return [];
    }
  },

  async getTaskStats(tasks?: Task[]): Promise<{
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  }> {
    let tasksToAnalyze = tasks;
    
    if (!tasksToAnalyze) {
      tasksToAnalyze = await this.getTasks();
    }
    
    const total = tasksToAnalyze.length;
    const completed = tasksToAnalyze.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending,
      completionRate
    };
  }
};