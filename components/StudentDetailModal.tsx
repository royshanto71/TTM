'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { Student, Class, Payment, Note } from '@/types';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, StickyNote, Trash2, Plus, RefreshCw } from 'lucide-react';

interface StudentDetailModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function StudentDetailModal({
  student,
  isOpen,
  onClose,
  onUpdate,
}: StudentDetailModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState(student.fees_per_month);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteText, setNoteText] = useState('');
  const [newMonthlyTarget, setNewMonthlyTarget] = useState(student.monthly_target_classes);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false });

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false });

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setClasses(classesData || []);
      setPayments(paymentsData || []);
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    if (isOpen) {
      fetchStudentData();
    }
  }, [isOpen, fetchStudentData]);

  async function handleAddClass() {
    try {
      const { error } = await supabase.from('classes').insert([
        {
          student_id: student.id,
          date: classDate,
          completed_count: 1,
        },
      ]);

      if (error) throw error;
      fetchStudentData();
      onUpdate();
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class');
    }
  }

  async function handleAddPayment() {
    try {
      const date = new Date(paymentDate);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();

      const { error } = await supabase.from('payments').insert([
        {
          student_id: student.id,
          amount: paymentAmount,
          date: paymentDate,
          month,
          year,
        },
      ]);

      if (error) throw error;
      fetchStudentData();
      onUpdate();
      setPaymentAmount(student.fees_per_month);
      setPaymentDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;

    try {
      const { error } = await supabase.from('notes').insert([
        {
          student_id: student.id,
          note_text: noteText,
        },
      ]);

      if (error) throw error;
      fetchStudentData();
      setNoteText('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);

      if (error) throw error;
      fetchStudentData();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  }

  async function handleUpdateMonthlyTarget() {
    try {
      const { error } = await supabase
        .from('students')
        .update({ monthly_target_classes: newMonthlyTarget })
        .eq('id', student.id);

      if (error) throw error;
      onUpdate();
      alert('Monthly target updated successfully!');
    } catch (error) {
      console.error('Error updating monthly target:', error);
      alert('Failed to update monthly target');
    }
  }

  async function handleStartNewMonth() {
    if (
      !confirm(
        'Are you sure you want to start a new month? This will reset completed classes to zero while keeping fees history and notes intact.'
      )
    ) {
      return;
    }

    try {
      // Delete all classes for this student (reset)
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('student_id', student.id);

      if (error) throw error;
      fetchStudentData();
      onUpdate();
      alert('New month started successfully!');
    } catch (error) {
      console.error('Error starting new month:', error);
      alert('Failed to start new month');
    }
  }

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthClasses = classes.filter((c) => {
    const classDate = new Date(c.date);
    return classDate.getMonth() === currentMonth && classDate.getFullYear() === currentYear;
  });
  const completedThisMonth = monthClasses.reduce((sum, c) => sum + c.completed_count, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = student.fees_per_month - (payments.find(p => p.month === new Date().toLocaleString('default', { month: 'long' }) && p.year === currentYear)?.amount || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student.name} size="xl">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading student data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Class:</span>
                <span className="ml-2 font-medium">{student.class}</span>
              </div>
              <div>
                <span className="text-gray-400">Contact:</span>
                <span className="ml-2 font-medium">{student.contact}</span>
              </div>
              <div>
                <span className="text-gray-400">Fees per Month:</span>
                <span className="ml-2 font-medium text-green-400">৳{student.fees_per_month}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Paid:</span>
                <span className="ml-2 font-medium text-green-400">৳{totalPaid}</span>
              </div>
            </div>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Monthly Progress</h3>
              <Button variant="warning" onClick={handleStartNewMonth}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start New Month
              </Button>
            </div>
            <ProgressBar
              current={completedThisMonth}
              target={student.monthly_target_classes}
              label="Classes Completed"
              variant="success"
            />
            <div className="mt-4 flex gap-2">
              <Input
                type="number"
                value={newMonthlyTarget}
                onChange={(e) => setNewMonthlyTarget(parseInt(e.target.value))}
                className="flex-1"
              />
              <Button onClick={handleUpdateMonthlyTarget}>Update Target</Button>
            </div>
          </Card>

          {/* Classes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Classes
              </h3>
            </div>
            <div className="flex gap-2 mb-4">
              <Input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddClass}>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {classes.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No classes recorded</p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                  >
                    <span>{new Date(cls.date).toLocaleDateString()}</span>
                    <span className="text-green-400">{cls.completed_count} class(es)</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Payments */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payments
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Input
                type="number"
                label="Amount (৳)"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              />
              <Input
                type="date"
                label="Date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <Button onClick={handleAddPayment} className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No payments recorded</p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                  >
                    <div>
                      <p className="font-medium">৳{payment.amount}</p>
                      <p className="text-xs text-gray-400">
                        {payment.month} {payment.year}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(payment.date).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Notes
              </h3>
            </div>
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button onClick={handleAddNote}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-gray-800/50"
                  >
                    <p className="flex-1">{note.note_text}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
