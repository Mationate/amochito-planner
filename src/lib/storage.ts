import { Task, WeeklyPlan, WeekDay, WeekInfo } from '@/types';

const STORAGE_KEY = 'weekly-planner-data';

// Funciones para el almacenamiento local
export const storage = {
  // Obtener todas las tareas
  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.tasks || [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  // Guardar tareas
  saveTasks: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      const currentData = storage.getData();
      const newData = {
        ...currentData,
        tasks,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  // Obtener datos completos
  getData: (): Partial<WeeklyPlan> => {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading data:', error);
      return {};
    }
  },

  // Limpiar almacenamiento
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Funciones de utilidad para tareas
export const taskUtils = {
  // Crear nueva tarea
  createTask: (title: string, day: WeekDay, date: string, description?: string): Task => {
    return {
      id: crypto.randomUUID(),
      title,
      description,
      completed: false,
      day,
      date,
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  // Alternar estado completado
  toggleTask: (tasks: Task[], taskId: string): Task[] => {
    return tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed, updatedAt: new Date() }
        : task
    );
  },

  // Eliminar tarea
  deleteTask: (tasks: Task[], taskId: string): Task[] => {
    return tasks.filter(task => task.id !== taskId);
  },

  // Actualizar tarea
  updateTask: (tasks: Task[], taskId: string, updates: Partial<Task>): Task[] => {
    return tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    );
  },

  // Obtener tareas por día
  getTasksByDay: (tasks: Task[], day: WeekDay): Task[] => {
    return tasks.filter(task => task.day === day);
  },

  // Obtener estadísticas
  getStats: (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending,
      completionRate,
    };
  },

  // Obtener tareas por fecha específica
  getTasksByDate: (tasks: Task[], date: string): Task[] => {
    return tasks.filter(task => task.date === date);
  },

  // Obtener tareas de una semana específica
  getTasksByWeek: (tasks: Task[], weekStart: string): Task[] => {
    const weekEnd = dateUtils.addDays(new Date(weekStart), 6);
    const weekEndStr = dateUtils.formatDate(weekEnd);
    return tasks.filter(task => task.date >= weekStart && task.date <= weekEndStr);
  },
};

// Utilidades para fechas
export const dateUtils = {
  // Formatear fecha a YYYY-MM-DD
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  // Obtener el lunes de la semana de una fecha
  getWeekStart: (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  },

  // Agregar días a una fecha
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Agregar semanas a una fecha
  addWeeks: (date: Date, weeks: number): Date => {
    return dateUtils.addDays(date, weeks * 7);
  },

  // Obtener información completa de una semana
  getWeekInfo: (date: Date): WeekInfo => {
    const weekStart = dateUtils.getWeekStart(date);
    const weekEnd = dateUtils.addDays(weekStart, 6);
    
    const days = [];
    const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = dateUtils.addDays(weekStart, i);
      days.push({
        date: currentDate,
        dayName: weekDays[i],
        dayNumber: currentDate.getDate(),
        monthName: currentDate.toLocaleDateString('es-ES', { month: 'long' })
      });
    }

    // Calcular número de semana
    const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    return {
      weekStart,
      weekEnd,
      weekNumber,
      year: weekStart.getFullYear(),
      days
    };
  },

  // Obtener el día de la semana en español
  getDayName: (dayIndex: number): WeekDay => {
    const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayIndex];
  },

  // Verificar si dos fechas están en la misma semana
  isSameWeek: (date1: Date, date2: Date): boolean => {
    const week1Start = dateUtils.getWeekStart(date1);
    const week2Start = dateUtils.getWeekStart(date2);
    return week1Start.getTime() === week2Start.getTime();
  }
};