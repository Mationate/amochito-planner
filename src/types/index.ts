export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  day: WeekDay;
  date: string; // YYYY-MM-DD format
  priority: Priority;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

export type WeekDay = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Priority = 'low' | 'medium' | 'high';

export type Category = 
  | 'work'
  | 'study'
  | 'finance'
  | 'health'
  | 'social'
  | 'entertainment'
  | 'shopping'
  | 'travel'
  | 'personal'
  | 'other';

export interface WeeklyPlan {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekInfo {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  year: number;
  days: { date: Date; dayName: WeekDay; dayNumber: number; monthName: string }[];
}

export const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'low', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { key: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
];

export const CATEGORIES: { key: Category; label: string; emoji: string; color: string }[] = [
  { key: 'work', label: 'Trabajo', emoji: '💼', color: 'bg-blue-100 text-blue-800' },
  { key: 'study', label: 'Estudio', emoji: '📚', color: 'bg-purple-100 text-purple-800' },
  { key: 'finance', label: 'Finanzas', emoji: '💰', color: 'bg-green-100 text-green-800' },
  { key: 'health', label: 'Salud', emoji: '🏥', color: 'bg-red-100 text-red-800' },
  { key: 'social', label: 'Social', emoji: '👥', color: 'bg-pink-100 text-pink-800' },
  { key: 'entertainment', label: 'Entretenimiento', emoji: '🎮', color: 'bg-orange-100 text-orange-800' },
  { key: 'shopping', label: 'Compras', emoji: '🛒', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'travel', label: 'Viajes', emoji: '✈️', color: 'bg-cyan-100 text-cyan-800' },
  { key: 'personal', label: 'Personal', emoji: '🏠', color: 'bg-gray-100 text-gray-800' },
  { key: 'other', label: 'Otros', emoji: '📝', color: 'bg-slate-100 text-slate-800' },
];