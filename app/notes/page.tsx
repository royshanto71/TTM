'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { Plus, Search, Trash2, Edit2, StickyNote as NoteIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Note, Student } from '@/types';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    note_text: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter notes based on search query
    if (searchQuery) {
      const filtered = notes.filter((n) => {
        const student = students.find((s) => s.id === n.student_id);
        return (
          student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.note_text.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchQuery, notes, students]);

  async function fetchData() {
    try {
      const [notesRes, studentsRes] = await Promise.all([
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('name'),
      ]);

      if (notesRes.error) throw notesRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setNotes(notesRes.data || []);
      setFilteredNotes(notesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('notes').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        student_id: '',
        note_text: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  }

  async function handleUpdateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ note_text: formData.note_text })
        .eq('id', editingNote.id);

      if (error) throw error;

      setEditingNote(null);
      setFormData({
        student_id: '',
        note_text: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  }

  function getStudentName(studentId: string) {
    return students.find((s) => s.id === studentId)?.name || 'Unknown';
  }

  function openEditModal(note: Note) {
    setEditingNote(note);
    setFormData({
      student_id: note.student_id,
      note_text: note.note_text,
    });
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingNote(null);
    setFormData({
      student_id: '',
      note_text: '',
    });
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading notes...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Notes</h1>
            <p className="text-gray-400 text-sm md:text-base">Manage student notes and observations</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by student name or note content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-8 md:py-12 text-sm md:text-base">
              {searchQuery ? 'No notes found' : 'No notes yet. Add your first note!'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredNotes.map((note) => (
              <Card key={note.id} hover>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-500/20 flex-shrink-0">
                        <NoteIcon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold truncate">
                          {getStudentName(note.student_id)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3 min-h-[100px]">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                      {note.note_text}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 md:pt-3 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs md:text-sm"
                      onClick={() => openEditModal(note)}
                    >
                      <Edit2 className="w-4 h-4 mr-1 md:mr-2" />
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" className="text-xs md:text-sm" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Note Modal */}
      <Modal
        isOpen={showAddModal || !!editingNote}
        onClose={closeModal}
        title={editingNote ? 'Edit Note' : 'Add New Note'}
      >
        <form onSubmit={editingNote ? handleUpdateNote : handleAddNote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Student</label>
            <select
              required
              disabled={!!editingNote}
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note Content</label>
            <textarea
              required
              value={formData.note_text}
              onChange={(e) => setFormData({ ...formData, note_text: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
              placeholder="Write your note here..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingNote ? 'Update Note' : 'Add Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
