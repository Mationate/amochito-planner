'use client';

import { useState, useEffect } from 'react';
import { Task, Category, Priority, CATEGORIES, PRIORITIES } from '@/types';
import { Edit2, Trash2, Check, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Tag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// API helper functions
const api = {
  async getAllTasks(): Promise<Task[]> {
    const response = await fetch('/api/tasks/all');
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }
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
  }
};

type SortField = 'title' | 'date' | 'priority' | 'category' | 'completed';
type SortDirection = 'asc' | 'desc';

const getCategoryEmoji = (category: Category): string => {
  const categoryMap = {
    work: '💼',
    study: '📚',
    finance: '💰',
    health: '🏥',
    social: '👥',
    entertainment: '🎮',
    shopping: '🛒',
    travel: '✈️',
    personal: '🏠',
    other: '📝'
  };
  return categoryMap[category] || '📝';
};

const getPriorityColor = (priority: Priority): string => {
  const colorMap = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  return colorMap[priority] || 'bg-gray-500';
};

const getPriorityLabel = (priority: Priority): string => {
  const labelMap = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
  return labelMap[priority] || 'Media';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Mañana';
  } else {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('other');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  
  // Data table states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await api.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Error al cargar las tareas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await api.toggleTask(task.id);
      await loadTasks();
      showToast(task.completed ? 'Tarea marcada como pendiente' : 'Tarea completada', 'success');
    } catch (error) {
      console.error('Error toggling task:', error);
      showToast('Error al actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }
    
    try {
      await api.deleteTask(taskId);
      await loadTasks();
      showToast('Tarea eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Error al eliminar la tarea', 'error');
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditPriority(task.priority);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditCategory('other');
    setEditPriority('medium');
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) return;

    try {
      await api.updateTask(editingTask, {
        title: editTitle.trim(),
        category: editCategory,
        priority: editPriority
      });
      await loadTasks();
      cancelEditing();
      showToast('Tarea actualizada correctamente', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Error al actualizar la tarea', 'error');
    }
  };

  // Filter, search and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Apply status filter
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.category.toLowerCase().includes(searchLower) ||
          task.priority.toLowerCase().includes(searchLower) ||
          task.day.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'completed':
          comparison = Number(a.completed) - Number(b.completed);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalItems = filteredAndSortedTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, endIndex);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Lista de Tareas</h1>
        <p className="text-muted-foreground">Gestiona todas tus tareas con búsqueda, filtros y paginación</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{tasks.filter(t => !t.completed).length}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">⏳</span>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.completed).length}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg p-6 border shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'completed', label: 'Completadas' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === option.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-muted/50 px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Tareas</h3>
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} tareas
            </div>
          </div>
        </div>

        {/* Table */}
        {paginatedTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay tareas</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No se encontraron tareas que coincidan con "${searchTerm}"` :
               filter === 'pending' ? 'No tienes tareas pendientes' :
               filter === 'completed' ? 'No tienes tareas completadas' :
               'Aún no has creado ninguna tarea'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-muted/30 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
                <div className="col-span-1">
                  <button
                    onClick={() => handleSort('completed')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Estado
                    {sortField === 'completed' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Tarea
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Categoría
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Prioridad
                    {sortField === 'priority' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Fecha
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {paginatedTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                  {editingTask === task.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título de la tarea"
                      />
                      
                      <div className="flex flex-wrap gap-4">
                        {/* Category */}
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as Category)}
                            className="px-3 py-1 text-sm border rounded-md bg-background"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.key} value={cat.key}>{cat.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as Priority)}
                            className="px-3 py-1 text-sm border rounded-md bg-background"
                          >
                            {PRIORITIES.map(priority => (
                              <option key={priority.key} value={priority.key}>{priority.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEditing} size="sm" variant="outline">
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Status */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Task Title */}
                      <div className="col-span-4">
                        <span className={`font-medium ${
                          task.completed 
                            ? 'line-through text-muted-foreground' 
                            : 'text-foreground'
                        }`}>
                          {task.title}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <span>{getCategoryEmoji(task.category)}</span>
                          <span className="text-sm text-muted-foreground">
                            {CATEGORIES.find(c => c.key === task.category)?.label}
                          </span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                          <span className="text-sm text-muted-foreground">
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(task.date)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end gap-1">
                        <Button
                          onClick={() => startEditingTask(task)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteTask(task.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-muted/30 px-6 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}