'use client';

import { useState, useEffect } from 'react';
import { Medication, MedicationSchedule } from '@/types';
import { Plus, X, Pill, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// API simplificada
const medicationApi = {
  async getMedications(): Promise<Medication[]> {
    const response = await fetch('/api/medications');
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  },

  async getSchedule(): Promise<MedicationSchedule[]> {
    const response = await fetch('/api/medications/schedule');
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      nextDose: new Date(item.nextDose),
      medication: {
        ...item.medication,
        createdAt: new Date(item.medication.createdAt),
        updatedAt: new Date(item.medication.updatedAt)
      }
    }));
  },

  async createMedication(medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
    const response = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medication)
    });
    return response.json();
  },

  async deleteMedication(id: string): Promise<void> {
    await fetch(`/api/medications/${id}`, {
      method: 'DELETE'
    });
  }
};

interface MedicationTrackerProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function MedicationTracker({ isExpanded, onToggle }: MedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<MedicationSchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    intervalHours: 8,
    startTime: '08:00'
  });

  const loadData = async () => {
    try {
      const [medsData, scheduleData] = await Promise.all([
        medicationApi.getMedications(),
        medicationApi.getSchedule()
      ]);
      setMedications(medsData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await medicationApi.createMedication({
        ...formData,
        isActive: true,
        notes: ''
      });
      setFormData({ name: '', dosage: '', intervalHours: 8, startTime: '08:00' });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating medication:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await medicationApi.deleteMedication(id);
      loadData();
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header compacto */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Pill className="text-blue-600 dark:text-blue-400" size={18} />
          <h3 className="font-medium text-gray-900 dark:text-white">Medicamentos</h3>
          {schedule.length > 0 && (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded-full">
              {schedule.length}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{isExpanded ? '−' : '+'}</span>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Botón agregar compacto */}
          <Button 
            onClick={() => setShowForm(!showForm)}
            size="sm"
            variant="outline"
            className="w-full h-8 text-sm"
          >
            <Plus size={14} className="mr-1" />
            Agregar
          </Button>

          {/* Formulario inline compacto */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <input
                type="text"
                placeholder="Medicamento"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                required
              />
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="text"
                  placeholder="Dosis"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  className="p-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  required
                />
                <select
                  value={formData.intervalHours}
                  onChange={(e) => setFormData({...formData, intervalHours: parseInt(e.target.value)})}
                  className="p-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value={4}>4h</option>
                  <option value={6}>6h</option>
                  <option value={8}>8h</option>
                  <option value={12}>12h</option>
                  <option value={24}>24h</option>
                </select>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="p-1.5 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div className="flex gap-1">
                <Button type="submit" size="sm" className="flex-1 h-7 text-xs">Guardar</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)} className="h-7 px-2">
                  <X size={12} />
                </Button>
              </div>
            </form>
          )}

          {/* Lista compacta de medicamentos */}
          {medications.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mis Medicamentos</h4>
              {medications.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{med.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {med.dosage} • {med.intervalHours}h
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDelete(med.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Horario compacto */}
          {schedule.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Próximas Dosis</h4>
              {schedule.slice(0, 3).map((item) => (
                <div key={item.medication.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Pill size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.medication.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.medication.dosage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.nextDose.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.timeUntilNext}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío compacto */}
          {medications.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Pill size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin medicamentos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}