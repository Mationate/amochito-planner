'use client';

import { useState, useEffect } from 'react';
import { Task, WeekDay, WeekInfo, Category, CATEGORIES } from '@/types';
import { dateUtils } from '@/lib/dateUtils';
// API helper functions
const api = {
  async getTasks(weekStart?: string): Promise<Task[]> {
    const url = weekStart ? `/api/tasks?weekStart=${weekStart}` : '/api/tasks';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async createTask(title: string, day: WeekDay, date: string, priority: string, category: Category): Promise<Task> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, day, date, priority, category })
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`/api/tasks?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  async toggleTask(id: string): Promise<Task> {
    const response = await fetch('/api/tasks/toggle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error('Failed to toggle task');
    return response.json();
  },

  async getStats(weekStart?: string): Promise<{ total: number; completed: number; pending: number; completionRate: number }> {
    const url = weekStart ? `/api/tasks/stats?weekStart=${weekStart}` : '/api/tasks/stats';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
};
import { Plus, Check, X, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

export default function WeeklyPlanner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeekInfo>(() => dateUtils.getWeekInfo(new Date()));
  const [addingTaskToDay, setAddingTaskToDay] = useState<WeekDay | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('other');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('other');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState<WeekDay | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'info', visible: false });

  // Función helper para obtener el emoji de la categoría
  const getCategoryEmoji = (category: Category) => {
    const categoryData = CATEGORIES.find(cat => cat.key === category);
    return categoryData?.emoji || '📝';
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Cargar tareas y estadísticas
  const loadData = async () => {
    try {
      setLoading(true);
      const weekStart = dateUtils.formatDate(currentWeek.weekStart);
      const [tasksData, statsData] = await Promise.all([
        api.getTasks(weekStart),
        api.getStats(weekStart)
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar solo estadísticas
  const updateStats = async () => {
    try {
      const weekStart = dateUtils.formatDate(currentWeek.weekStart);
      const statsData = await api.getStats(weekStart);
      setStats(statsData);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek.weekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(dateUtils.getWeekInfo(newDate));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dateUtils.getWeekInfo(new Date()));
  };

  const startAddingTaskToDay = (day: WeekDay) => {
    setAddingTaskToDay(day);
    setNewTaskTitle('');
    setNewTaskCategory('other');
  };

  const cancelAddingTask = () => {
    setAddingTaskToDay(null);
    setNewTaskTitle('');
    setNewTaskCategory('other');
  };

  const handleAddTaskToDay = async (day: WeekDay) => {
    if (!newTaskTitle.trim()) return;

    try {
      const dayInfo = currentWeek.days.find(d => d.dayName === day);
      if (!dayInfo) return;

      const newTask = await api.createTask(
        newTaskTitle.trim(),
        day,
        dateUtils.formatDate(dayInfo.date),
        'medium',
        newTaskCategory
      );

      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
      setNewTaskCategory('other');
      setAddingTaskToDay(null);
      showToast('Tarea creada exitosamente', 'success');
      updateStats(); // Actualizar solo estadísticas
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Error al crear la tarea', 'error');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTask = await api.toggleTask(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      showToast('Tarea actualizada', 'success');
      updateStats(); // Actualizar solo estadísticas
    } catch (error) {
      console.error('Error toggling task:', error);
      showToast('Error al actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      showToast('Tarea eliminada', 'success');
      updateStats(); // Actualizar solo estadísticas
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Error al eliminar la tarea', 'error');
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditCategory(task.category);
  };

  const handleEditTask = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const updatedTask = await api.updateTask(taskId, { 
        title: newTitle.trim(),
        category: editCategory
      });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      setEditingTask(null);
      setEditTitle('');
      setEditCategory('other');
      showToast('Tarea actualizada', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Error al actualizar la tarea', 'error');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newDay = over.id as WeekDay;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.day === newDay) return;

    const dayInfo = currentWeek.days.find(d => d.dayName === newDay);
    if (!dayInfo) return;

    try {
      setDayLoading(newDay);
      const updatedTask = await api.updateTask(taskId, {
        day: newDay,
        date: dateUtils.formatDate(dayInfo.date)
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? updatedTask : t
      ));
      
      const dayNames = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
      };
      
      showToast(`Tarea movida a ${dayNames[newDay]}`, 'success');
      updateStats();
    } catch (error) {
      console.error('Error moving task:', error);
      showToast('Error al mover la tarea', 'error');
    } finally {
      setDayLoading(null);
    }
  };

  // Función auxiliar para obtener tareas por fecha
  const getTasksByDate = (date: string, dayName?: WeekDay): Task[] => {
    return tasks.filter(task => {
      // Normalizar fechas para comparación exacta
      const taskDate = task.date.trim();
      const searchDate = date.trim();
      const dateMatches = taskDate === searchDate;
      
      // Si se proporciona dayName, también verificar que coincida
      if (dayName) {
        return dateMatches && task.day === dayName;
      }
      
      return dateMatches;
    });
  };

  // Componente para tareas draggables
  const DraggableTask = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: task.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`p-4 rounded-lg border-2 transition-all cursor-move hover:shadow-md ${
          task.completed 
            ? 'bg-green-50 border-green-200 opacity-75 dark:bg-green-900 dark:border-green-700'
            : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
        } ${isDragging ? 'opacity-50' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {editingTask === task.id ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEditTask(task.id, editTitle);
                }
              }}
              autoFocus
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as Category)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map(category => (
                <option key={category.key} value={category.key}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                onClick={() => handleEditTask(task.id, editTitle)}
                variant="ghost"
                size="icon"
                className="text-green-600 hover:bg-green-100 dark:hover:bg-green-800"
              >
                <Check size={16} />
              </Button>
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setEditTitle('');
                  setEditCategory('other');
                }}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <button
                onClick={() => handleToggleTask(task.id)}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400 dark:border-gray-500 dark:hover:border-green-400'
                }`}
              >
                {task.completed && <Check size={14} />}
              </button>
              <span
                className={`text-sm flex-1 leading-relaxed ${
                  task.completed 
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="mr-2">{getCategoryEmoji(task.category)}</span>
                {task.title}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => startEditing(task)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900 h-8 w-8"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900 h-8 w-8"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente para días droppables
   const DroppableDay = ({ dayInfo }: { dayInfo: any }) => {
     const { isOver, setNodeRef } = useDroppable({
       id: dayInfo.dayName,
     });

     const formattedDate = dateUtils.formatDate(dayInfo.date);
     const dayTasks = getTasksByDate(formattedDate, dayInfo.dayName);
     const completedTasks = dayTasks.filter(task => task.completed).length;
     const isToday = dateUtils.isSameWeek(dayInfo.date, new Date()) && 
                    dayInfo.date.toDateString() === new Date().toDateString();
     const isDayLoading = dayLoading === dayInfo.dayName;

     return (
       <div
         ref={setNodeRef}
         className={`rounded-xl shadow-sm p-6 min-h-[500px] transition-all hover:shadow-md cursor-pointer ${
           isToday 
             ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 ring-4 ring-blue-400 shadow-lg shadow-blue-200 dark:shadow-blue-800 border-2 border-blue-300 dark:border-blue-600' 
             : 'bg-white dark:bg-gray-800'
         } ${
           addingTaskToDay === dayInfo.dayName ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900' : ''
         } ${
           isOver ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900' : ''
         } ${
           isDayLoading ? 'opacity-75' : ''
         }`}
         onClick={() => {
           if (!addingTaskToDay && !isDayLoading) {
             startAddingTaskToDay(dayInfo.dayName);
           }
         }}
       >
        <div className="text-center mb-6">
           {isToday && (
             <div className="mb-3">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold animate-pulse">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
                 HOY
               </div>
             </div>
           )}
           {isDayLoading && (
             <div className="mb-3">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
               <p className="text-xs text-purple-600 mt-1">Moviendo tarea...</p>
             </div>
           )}
           <div className={`text-4xl font-bold mb-2 ${
             isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
           }`}>
             {dayInfo.dayNumber}
           </div>
          <div className={`text-xl font-bold mb-1 ${
            isToday ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'
          }`}>
            {dayInfo.dayName === 'monday' && 'Lunes'}
            {dayInfo.dayName === 'tuesday' && 'Martes'}
            {dayInfo.dayName === 'wednesday' && 'Miércoles'}
            {dayInfo.dayName === 'thursday' && 'Jueves'}
            {dayInfo.dayName === 'friday' && 'Viernes'}
            {dayInfo.dayName === 'saturday' && 'Sábado'}
            {dayInfo.dayName === 'sunday' && 'Domingo'}
          </div>
          <div className="text-sm capitalize mb-3 text-gray-500 dark:text-gray-400">
            {dayInfo.monthName}
          </div>
          <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
            completedTasks === dayTasks.length && dayTasks.length > 0
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
              : dayTasks.length > 0
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {completedTasks}/{dayTasks.length} tareas
          </div>
        </div>
        
        <div className="space-y-3">
          {addingTaskToDay === dayInfo.dayName && (
            <div className="p-4 rounded-lg border-2 border-dashed border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Título de la tarea"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTaskToDay(dayInfo.dayName);
                    }
                  }}
                  autoFocus
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  {CATEGORIES.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.emoji} {category.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddTaskToDay(dayInfo.dayName)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Guardar
                  </Button>
                  <Button
                    onClick={cancelAddingTask}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {dayTasks.length === 0 && addingTaskToDay !== dayInfo.dayName ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <div className="text-sm mb-1">
                Sin tareas programadas
              </div>
              <div className="text-blue-500 text-xs font-medium">
                Haz clic aquí para agregar una tarea
              </div>
            </div>
          ) : (
            dayTasks.map(task => (
              <DraggableTask key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-screen flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen transition-colors duration-300 bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6 p-4">
          {/* Navegación de semanas */}
          <div className="rounded-xl shadow-sm p-6 transition-colors duration-300 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateWeek('prev')}
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
              >
                <ChevronLeft size={20} className="text-muted-foreground" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Semana {currentWeek.weekNumber}, {currentWeek.year}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentWeek.weekStart.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long' 
                  })} - {currentWeek.weekEnd.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              
              <Button
                onClick={() => navigateWeek('next')}
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
              >
                <ChevronRight size={20} className="text-muted-foreground" />
              </Button>
            </div>
            
            <Button
              onClick={goToCurrentWeek}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              Semana Actual
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-primary/80">Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <div className="text-2xl font-bold text-accent">{stats.completed}</div>
              <div className="text-sm text-accent/80">Completadas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
              <div className="text-sm text-primary/70">Progreso</div>
            </div>
          </div>
        </div>

        {/* Día actual destacado */}
        {(() => {
          const today = currentWeek.days.find(dayInfo => 
            dayInfo.date.toDateString() === new Date().toDateString()
          );
          const otherDays = currentWeek.days.filter(dayInfo => 
            dayInfo.date.toDateString() !== new Date().toDateString()
          );
          
          return (
            <div className="space-y-8">
              {/* Día de hoy - Grande y central */}
              {today && (
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        📅 Hoy - {today.date.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h2>
                    </div>
                    <DroppableDay key={today.dayName} dayInfo={today} />
                  </div>
                </div>
              )}
              
              {/* Otros días de la semana */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                  📋 Otros días de la semana
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherDays.map((dayInfo) => (
                    <DroppableDay key={dayInfo.dayName} dayInfo={dayInfo} />
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Funcionalidades actuales y próximas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funcionalidades actuales */}
          <div className="rounded-xl p-6 border bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900 dark:to-emerald-900 dark:border-green-700">
            <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
              ✅ Funcionalidades Disponibles
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🎯</span>
                <span className="text-green-800 dark:text-green-200"><strong>Crear tareas:</strong> Clic en cualquier día</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🔄</span>
                <span className="text-green-800 dark:text-green-200"><strong>Drag & Drop:</strong> Arrastra tareas entre días</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✏️</span>
                <span className="text-foreground"><strong>Edición:</strong> Modifica título y categoría</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">📊</span>
                <span className="text-foreground"><strong>Estadísticas:</strong> Progreso en tiempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">🌟</span>
                <span className="text-foreground"><strong>Día actual:</strong> Destacado y prioritario</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">☁️</span>
                <span className="text-foreground"><strong>Guardado:</strong> Automático en NeonDB</span>
              </div>
            </div>
          </div>

          {/* Funcionalidades completadas */}
          <div className="rounded-xl p-6 border bg-accent/5 border-accent/20">
            <h3 className="text-lg font-semibold mb-3 text-accent">
              ✅ Funcionalidades Completadas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">⏰</span>
                <span className="text-foreground"><strong>Recordatorios:</strong> Sistema completo de notificaciones por email</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">🎨</span>
                <span className="text-foreground"><strong>Temas:</strong> Personalización completa de colores y modo oscuro/claro</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">💾</span>
                <span className="text-foreground"><strong>Persistencia:</strong> Configuraciones guardadas automáticamente</span>
              </div>
            </div>
          </div>

          {/* Próximas funcionalidades */}
          <div className="rounded-xl p-6 border bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold mb-3 text-primary">
              🚀 Próximas Funcionalidades
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">📱</span>
                <span className="text-foreground"><strong>PWA:</strong> Instalación como app móvil</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">🔗</span>
                <span className="text-foreground"><strong>Subtareas:</strong> Tareas anidadas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">📈</span>
                <span className="text-foreground"><strong>Analytics:</strong> Reportes de productividad</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">🔄</span>
                <span className="text-foreground"><strong>Sincronización:</strong> Múltiples dispositivos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de guardado */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Guardado automáticamente en la nube
          </div>
        </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-blue-300 shadow-lg opacity-90">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{activeTask.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}