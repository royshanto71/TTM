'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { Plus, Search, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';

import StudentDetailModal from '@/components/StudentDetailModal';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    contact: '',
    monthly_target_classes: 0,
    fees_per_month: 0,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search query
    if (searchQuery) {
      const filtered = students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        name: '',
        class: '',
        contact: '',
        monthly_target_classes: 0,
        fees_per_month: 0,
      });
      fetchStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student');
    }
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm('Are you sure you want to delete this student? This will also delete all related classes, payments, and notes.')) {
      return;
    }

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) throw error;
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading students...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Students</h1>
            <p className="text-gray-400">Manage your students</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-12">
              {searchQuery ? 'No students found' : 'No students yet. Add your first student!'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} hover>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                    <p className="text-gray-400 text-sm">Class: {student.class}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contact:</span>
                      <span>{student.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Target:</span>
                      <span>{student.monthly_target_classes} classes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fees:</span>
                      <span className="text-green-400 font-medium">
                        ৳{student.fees_per_month}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input
            label="Name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Class"
            type="text"
            required
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
          />
          <Input
            label="Contact"
            type="text"
            required
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
          <Input
            label="Monthly Class Target"
            type="number"
            required
            min="0"
            value={formData.monthly_target_classes}
            onChange={(e) =>
              setFormData({ ...formData, monthly_target_classes: parseInt(e.target.value) })
            }
          />
          <Input
            label="Fees Per Month (৳)"
            type="number"
            required
            min="0"
            value={formData.fees_per_month}
            onChange={(e) =>
              setFormData({ ...formData, fees_per_month: parseFloat(e.target.value) })
            }
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdate={fetchStudents}
        />
      )}
    </AppLayout>
  );
}
