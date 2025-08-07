'use client';

import { useState, useEffect } from 'react';
import { Task, WeekDay, WeekInfo, Category, CATEGORIES } from '@/types';
import { dateUtils } from '@/lib/dateUtils';
// API helper functions
const api = {
  async getTasks(weekStart?: string): Promise<Task[]> {
    const url = weekStart ? `/api/tasks?weekStart=${weekStart}` : '/api/tasks';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tasks');
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
    if (!response.ok) throw new Error('Failed to fetch stats');
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
      loadData(); // Recargar estadísticas
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
      loadData(); // Recargar estadísticas
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
      loadData(); // Recargar estadísticas
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
      const updatedTask = await api.updateTask(taskId, {
        day: newDay,
        date: dateUtils.formatDate(dayInfo.date)
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? updatedTask : t
      ));
      showToast(`Tarea movida a ${newDay}`, 'success');
    } catch (error) {
      console.error('Error moving task:', error);
      showToast('Error al mover la tarea', 'error');
    }
  };

  // Función auxiliar para obtener tareas por fecha
  const getTasksByDate = (date: string): Task[] => {
    return tasks.filter(task => task.date === date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6 p-4">
          {/* Navegación de semanas */}
          <div className="rounded-xl shadow-sm p-6 transition-colors duration-300 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateWeek('prev')}
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Semana {currentWeek.weekNumber}, {currentWeek.year}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
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
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Completadas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Pendientes</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900">
              <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Progreso</div>
            </div>
          </div>
        </div>

        {/* Planner semanal mejorado - Vista vertical */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentWeek.days.map(dayInfo => {
            const dayTasks = getTasksByDate(dateUtils.formatDate(dayInfo.date));
            const completedTasks = dayTasks.filter(task => task.completed).length;
            const isToday = dateUtils.formatDate(new Date()) === dateUtils.formatDate(dayInfo.date);
            
            return (
              <div
                key={dayInfo.dayName}
                id={dayInfo.dayName}
                className={`rounded-xl shadow-sm p-6 min-h-[500px] transition-all hover:shadow-md cursor-pointer bg-white dark:bg-gray-800 ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                } ${
                  isToday ? 'bg-blue-50 dark:bg-blue-900' : ''
                } ${
                  addingTaskToDay === dayInfo.dayName ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900' : ''
                }`}
                onClick={() => {
                  if (!addingTaskToDay) {
                    startAddingTaskToDay(dayInfo.dayName);
                  }
                }}
              >
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {dayInfo.dayNumber}
                  </div>
                  <div className={`text-lg font-semibold mb-1 ${
                    isToday ? 'text-blue-700' : 'text-gray-700 dark:text-gray-200'
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
                          placeholder="Escribe tu nueva tarea..."
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
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
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <Check size={14} />
                            Guardar
                          </Button>
                          <Button
                            onClick={cancelAddingTask}
                            variant="secondary"
                            size="sm"
                          >
                            <X size={14} />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dayTasks.length === 0 && addingTaskToDay !== dayInfo.dayName ? (
                    <div className="text-center py-8">
                      <div className="text-sm italic mb-2 text-gray-400 dark:text-gray-500">
                        Sin tareas programadas
                      </div>
                      <div className="text-blue-500 text-xs font-medium">
                        Haz clic aquí para agregar una tarea
                      </div>
                    </div>
                  ) : (
                    dayTasks.map(task => (
                      <div
                        key={task.id}
                        id={task.id}
                        draggable
                        className={`p-4 rounded-lg border-2 transition-all cursor-move hover:shadow-md ${
                          task.completed 
                            ? 'bg-green-50 border-green-200 opacity-75 dark:bg-green-900 dark:border-green-700'
                            : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500'
                        }`}
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Información sobre funcionalidades */}
        <div className="rounded-xl p-6 border bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900 dark:to-emerald-900 dark:border-green-700">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
            ✨ Guía de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🎯</span>
                <span className="text-green-800 dark:text-green-200"><strong>Crear tareas:</strong> Haz clic en cualquier día para agregar una tarea directamente</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✏️</span>
                <span className="text-green-800 dark:text-green-200"><strong>Editar:</strong> Haz clic en el ícono de lápiz para modificar una tarea</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🗑️</span>
                <span className="text-green-800 dark:text-green-200"><strong>Eliminar:</strong> Usa el ícono de papelera para borrar tareas</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🔄</span>
                <span className="text-green-800 dark:text-green-200"><strong>Mover tareas:</strong> Arrastra y suelta entre días</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">📊</span>
                <span className="text-green-800 dark:text-green-200"><strong>Estadísticas:</strong> Ve tu progreso semanal en tiempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">☁️</span>
                <span className="text-green-800 dark:text-green-200"><strong>Guardado:</strong> Automático en la nube (NeonDB)</span>
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