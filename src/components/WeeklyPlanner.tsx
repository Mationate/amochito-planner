'use client';

import { useState, useEffect } from 'react';
import { Task, WeekDay, WeekInfo, Category, CATEGORIES } from '@/types';
import { dateUtils } from '@/lib/storage';
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
import { Plus, Check, X, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar, Moon, Sun } from 'lucide-react';
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

  // Función para mostrar toast
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Función para actualizar una tarea específica en el estado
  const updateTaskInState = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  // Función para agregar una tarea al estado
  const addTaskToState = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Función para eliminar una tarea del estado
  const removeTaskFromState = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // Función para actualizar estadísticas
  const updateStats = async () => {
    try {
      const weekStats = await api.getStats(dateUtils.formatDate(currentWeek.weekStart));
      setStats(weekStats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  // Cargar tareas de la semana actual
  const loadWeekTasks = async () => {
    setLoading(true);
    try {
      const weekTasks = await api.getTasks(dateUtils.formatDate(currentWeek.weekStart));
      setTasks(weekTasks);
      const weekStats = await api.getStats(dateUtils.formatDate(currentWeek.weekStart));
      setStats(weekStats);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar tareas cuando cambie la semana
  useEffect(() => {
    loadWeekTasks();
  }, [currentWeek]);

  const handleAddTaskToDay = async (dayName: WeekDay) => {
    if (newTaskTitle.trim()) {
      try {
        const selectedDate = currentWeek.days.find(day => day.dayName === dayName);
        if (selectedDate) {
          const newTask = await api.createTask(
            newTaskTitle.trim(), 
            dayName,
            dateUtils.formatDate(selectedDate.date),
            'medium',
            newTaskCategory
          );
          if (newTask) {
            addTaskToState(newTask); // Agregar tarea al estado local
            await updateStats(); // Actualizar estadísticas
            setNewTaskTitle('');
            setNewTaskCategory('other');
            setAddingTaskToDay(null);
            showToast('Tarea creada exitosamente', 'success');
          }
        }
      } catch (error) {
        console.error('Error creating task:', error);
        showToast('Error al crear la tarea', 'error');
      }
    }
  };

  const startAddingTaskToDay = (dayName: WeekDay) => {
    setAddingTaskToDay(dayName);
    setNewTaskTitle('');
    setNewTaskCategory('other');
  };

  const cancelAddingTask = () => {
    setAddingTaskToDay(null);
    setNewTaskTitle('');
    setNewTaskCategory('other');
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const updatedTask = await api.toggleTask(taskId);
      if (updatedTask) {
        updateTaskInState(updatedTask); // Actualizar tarea en estado local
        await updateStats(); // Actualizar estadísticas
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      showToast('Error al actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      removeTaskFromState(taskId); // Eliminar tarea del estado local
      await updateStats(); // Actualizar estadísticas
      showToast('Tarea eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Error al eliminar la tarea', 'error');
    }
  };

  const handleEditTask = async (taskId: string, newTitle: string) => {
    if (newTitle.trim()) {
      try {
        const updatedTask = await api.updateTask(taskId, { title: newTitle.trim(), category: editCategory });
        if (updatedTask) {
          updateTaskInState(updatedTask); // Actualizar tarea en estado local
          showToast('Tarea editada exitosamente', 'success');
        }
      } catch (error) {
        console.error('Error editing task:', error);
        showToast('Error al editar la tarea', 'error');
      }
    }
    setEditingTask(null);
    setEditTitle('');
    setEditCategory('other');
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditCategory(task.category);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const weeksToAdd = direction === 'next' ? 1 : -1;
    const newDate = dateUtils.addWeeks(currentWeek.weekStart, weeksToAdd);
    setCurrentWeek(dateUtils.getWeekInfo(newDate));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(dateUtils.getWeekInfo(new Date()));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newDayName = over.id as WeekDay;
    
    // Encontrar la nueva fecha basada en el día
    const newDayInfo = currentWeek.days.find(day => day.dayName === newDayName);
    if (!newDayInfo) return;

    const newDate = dateUtils.formatDate(newDayInfo.date);
    
    try {
      const updatedTask = await api.updateTask(taskId, { 
        day: newDayName, 
        date: newDate 
      });
      
      if (updatedTask) {
        updateTaskInState(updatedTask); // Actualizar tarea en estado local
        showToast('Tarea movida exitosamente', 'success');
      }
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
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              
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
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <button
              onClick={goToCurrentWeek}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar size={16} />
              Semana Actual
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              darkMode ? 'bg-green-900' : 'bg-green-50'
            }`}>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className={`text-sm ${
                darkMode ? 'text-green-300' : 'text-green-700'
              }`}>Completadas</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              darkMode ? 'bg-orange-900' : 'bg-orange-50'
            }`}>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className={`text-sm ${
                darkMode ? 'text-orange-300' : 'text-orange-700'
              }`}>Pendientes</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              darkMode ? 'bg-purple-900' : 'bg-purple-50'
            }`}>
              <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
              <div className={`text-sm ${
                darkMode ? 'text-purple-300' : 'text-purple-700'
              }`}>Progreso</div>
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
                className={`rounded-xl shadow-sm p-6 min-h-[500px] transition-all hover:shadow-md cursor-pointer ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                } ${
                  isToday && darkMode ? 'bg-blue-900' : isToday ? 'bg-blue-50' : ''
                } ${
                  addingTaskToDay === dayInfo.dayName && darkMode ? 'ring-2 ring-green-500 bg-green-900' : addingTaskToDay === dayInfo.dayName ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => {
                  if (!addingTaskToDay) {
                    startAddingTaskToDay(dayInfo.dayName);
                  }
                }}
              >
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold mb-2 ${
                    isToday ? 'text-blue-600' : darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {dayInfo.dayNumber}
                  </div>
                  <div className={`text-lg font-semibold mb-1 ${
                    isToday ? 'text-blue-700' : darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {dayInfo.dayName === 'monday' && 'Lunes'}
                    {dayInfo.dayName === 'tuesday' && 'Martes'}
                    {dayInfo.dayName === 'wednesday' && 'Miércoles'}
                    {dayInfo.dayName === 'thursday' && 'Jueves'}
                    {dayInfo.dayName === 'friday' && 'Viernes'}
                    {dayInfo.dayName === 'saturday' && 'Sábado'}
                    {dayInfo.dayName === 'sunday' && 'Domingo'}
                  </div>
                  <div className={`text-sm capitalize mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {dayInfo.monthName}
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                    completedTasks === dayTasks.length && dayTasks.length > 0
                      ? 'bg-green-100 text-green-800'
                      : dayTasks.length > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {completedTasks}/{dayTasks.length} tareas
                  </div>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                  {/* Formulario para agregar tarea en este día */}
                  {addingTaskToDay === dayInfo.dayName && (
                    <div className={`border-2 rounded-lg p-4 mb-4 ${
                      darkMode 
                        ? 'bg-green-900 border-green-700' 
                        : 'bg-green-50 border-green-200'
                    }`} onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Título de la tarea..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' 
                              : 'bg-white border-green-300 text-gray-900 placeholder-gray-500'
                          }`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTaskToDay(dayInfo.dayName);
                            } else if (e.key === 'Escape') {
                              cancelAddingTask();
                            }
                          }}
                          autoFocus
                        />
                        <select
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value as Category)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-green-300 text-gray-900'
                          }`}
                        >
                          {CATEGORIES.map(category => (
                            <option key={category.key} value={category.key}>
                              {category.emoji} {category.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddTaskToDay(dayInfo.dayName)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <Check size={14} />
                            Guardar
                          </button>
                          <button
                            onClick={cancelAddingTask}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                              darkMode 
                                ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                            }`}
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dayTasks.length === 0 && addingTaskToDay !== dayInfo.dayName ? (
                    <div className="text-center py-8">
                      <div className={`text-sm italic mb-2 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
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
                            ? darkMode ? 'bg-green-900 border-green-700 opacity-75' : 'bg-green-50 border-green-200 opacity-75'
                            : darkMode ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {editingTask === task.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
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
                              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              {CATEGORIES.map(category => (
                                <option key={category.key} value={category.key}>
                                  {category.emoji} {category.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditTask(task.id, editTitle)}
                                className={`p-2 text-green-600 rounded-lg transition-colors ${
                                  darkMode ? 'hover:bg-green-800' : 'hover:bg-green-100'
                                }`}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTask(null);
                                  setEditTitle('');
                                  setEditCategory('other');
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode 
                                    ? 'text-gray-400 hover:bg-gray-700' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                <X size={16} />
                              </button>
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
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {task.completed && <Check size={14} />}
                              </button>
                              <span
                                className={`text-sm flex-1 leading-relaxed ${
                                  task.completed 
                                    ? darkMode ? 'line-through text-gray-400' : 'line-through text-gray-500'
                                    : darkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}
                              >
                                <span className="mr-2">{getCategoryEmoji(task.category)}</span>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditing(task)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode 
                                    ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900' 
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode 
                                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900' 
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
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
        <div className={`rounded-xl p-6 border ${
          darkMode 
            ? 'bg-gradient-to-r from-green-900 to-emerald-900 border-green-700' 
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            darkMode ? 'text-green-100' : 'text-green-900'
          }`}>
            ✨ Guía de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🎯</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Crear tareas:</strong> Haz clic en cualquier día para agregar una tarea directamente</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">🔄</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Reorganizar:</strong> Arrastra y suelta tareas entre días</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">📅</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Navegar:</strong> Usa las flechas o "Semana Actual"</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✅</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Completar:</strong> Haz clic en el círculo junto a la tarea</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">📊</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Estadísticas:</strong> Solo de la semana actual</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">💾</span>
                <span className={darkMode ? 'text-green-200' : 'text-green-800'}><strong>Guardado:</strong> Automático en la nube (NeonDB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de guardado */}
        <div className="text-center py-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            darkMode 
              ? 'bg-green-900 text-green-200' 
              : 'bg-green-100 text-green-800'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Guardado automáticamente en la nube
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="p-4 bg-white rounded-lg border-2 border-blue-300 shadow-lg opacity-90">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 border-gray-300" />
              <span className="text-sm text-gray-900">{activeTask.title}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <Check size={20} />}
            {toast.type === 'error' && <X size={20} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      </DndContext>
    </div>
  );
}