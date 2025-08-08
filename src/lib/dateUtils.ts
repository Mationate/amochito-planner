import { WeekDay, WeekInfo } from '@/types';

export const dateUtils = {
  // Formatear fecha a string YYYY-MM-DD
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  // Obtener el inicio de la semana (lunes)
  getWeekStart: (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    const result = new Date(d);
    result.setDate(diff);
    return result;
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

  // Obtener información completa de la semana
  getWeekInfo: (date: Date): WeekInfo => {
    const weekStart = dateUtils.getWeekStart(date);
    const weekEnd = dateUtils.addDays(weekStart, 6);
    
    // Calcular número de semana del año
    const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dateUtils.addDays(weekStart, i);
      days.push({
        date: currentDate,
        dayName: dateUtils.getDayName(i),
        dayNumber: currentDate.getDate(),
        monthName: currentDate.toLocaleDateString('es-ES', { month: 'long' })
      });
    }
    
    return {
      weekStart,
      weekEnd,
      weekNumber,
      year: weekStart.getFullYear(),
      days
    };
  },
  
  // Obtener nombre del día por índice (0 = lunes)
  getDayName: (dayIndex: number): WeekDay => {
    const days: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days[dayIndex];
  },
  
  // Verificar si dos fechas están en la misma semana
  isSameWeek: (date1: Date, date2: Date): boolean => {
    const week1Start = dateUtils.getWeekStart(date1);
    const week2Start = dateUtils.getWeekStart(date2);
    return week1Start.getTime() === week2Start.getTime();
  }
};