'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Calendar from '@/components/Calendar';
import { Plus, Search, Trash2, Calendar as CalendarIcon, CheckCircle, Clock, LayoutGrid, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Class, Student } from '@/types';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    completed_count: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter classes based on search query and selected date
    let filtered = classes;

    if (selectedDate) {
      filtered = filtered.filter((c) => c.date === selectedDate);
    }

    if (searchQuery) {
      filtered = filtered.filter((c) => {
        const student = students.find((s) => s.id === c.student_id);
        return (
          student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.date.includes(searchQuery)
        );
      });
    }

    setFilteredClasses(filtered);
  }, [searchQuery, classes, students, selectedDate]);

  async function fetchData() {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        supabase.from('classes').select('*').order('date', { ascending: false }),
        supabase.from('students').select('*').order('name'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setClasses(classesRes.data || []);
      setFilteredClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('classes').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        completed_count: 1,
      });
      fetchData();
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class');
    }
  }

  async function handleDeleteClass(id: string) {
    if (!confirm('Are you sure you want to delete this class record?')) {
      return;
    }

    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  }

  function getStudentName(studentId: string) {
    return students.find((s) => s.id === studentId)?.name || 'Unknown';
  }

  function getDayName(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  function formatTime(timeStr?: string) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading classes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Classes</h1>
            <p className="text-gray-400">Track student class attendance</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              variant="ghost"
              className="w-auto"
            >
              {viewMode === 'calendar' ? (
                <>
                  <LayoutGrid className="w-5 h-5 mr-2" />
                  List View
                </>
              ) : (
                <>
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Calendar
                </>
              )}
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by student name or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <>
            <Calendar 
              classes={classes} 
              students={students}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />

            {selectedDate && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {getDayName(selectedDate)} - {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                    Clear
                  </Button>
                </div>
                {filteredClasses.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No classes on this date</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClasses.map((classItem) => (
                      <div key={classItem.id} className="glass rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">
                              {getStudentName(classItem.student_id)}
                            </h3>
                            {classItem.time && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                {formatTime(classItem.time)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClass(classItem.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-sm">
                            <span className="font-bold text-green-400">
                              {classItem.completed_count}
                            </span>{' '}
                            {classItem.completed_count === 1 ? 'class' : 'classes'} completed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {filteredClasses.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-12">
                  {searchQuery ? 'No classes found' : 'No classes yet. Add your first class!'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredClasses.map((classItem) => (
                  <Card key={classItem.id} hover>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold mb-1">
                            {getStudentName(classItem.student_id)}
                          </h3>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{getDayName(classItem.date)}</span>
                              <span>•</span>
                              <span>{new Date(classItem.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            {classItem.time && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                {formatTime(classItem.time)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm">
                          <span className="font-bold text-green-400">
                            {classItem.completed_count}
                          </span>{' '}
                          {classItem.completed_count === 1 ? 'class' : 'classes'} completed
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Class Record"
      >
        <form onSubmit={handleAddClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Student</label>
            <select
              required
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Input
            label="Time"
            type="time"
            required
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
          <Input
            label="Number of Classes Completed"
            type="number"
            required
            min="1"
            value={formData.completed_count}
            onChange={(e) =>
              setFormData({ ...formData, completed_count: parseInt(e.target.value) })
            }
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Class
            </Button>
          </div>
        </form>
      </Modal>

    </AppLayout>
  );
}
