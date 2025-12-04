'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import ProgressBar from './ProgressBar';
import { Student, Class, Payment, Note } from '@/types';
import { supabase } from '@/lib/supabase';
import { Calendar, DollarSign, StickyNote, Trash2, Plus, RefreshCw, Download, User, Phone, CreditCard } from 'lucide-react';
import { generateStudentReport } from './ReportGenerator';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student.name} size="xl">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading student data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Student Details Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="section-header px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                <User className="w-4 h-4" />
                Student Details
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => generateStudentReport({ student, classes, payments, notes })}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Report
              </Button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Class</span>
                <span className="text-sm font-medium">{student.class}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Contact</span>
                <span className="text-sm font-medium">{student.contact}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Monthly Fees</span>
                <span className="text-sm font-medium text-green-400">৳{student.fees_per_month}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Total Paid</span>
                <span className="text-sm font-medium text-green-400">৳{totalPaid}</span>
              </div>
            </div>
          </div>

          {/* Monthly Progress Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="section-header px-4 py-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                <RefreshCw className="w-4 h-4" />
                Monthly Progress
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleStartNewMonth} 
                className="h-8 px-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
              >
                Start New Month
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <ProgressBar
                current={completedThisMonth}
                target={student.monthly_target_classes}
                label="Classes Completed"
                variant="success"
              />
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <Input
                  type="number"
                  label="New Target"
                  value={newMonthlyTarget}
                  onChange={(e) => setNewMonthlyTarget(parseInt(e.target.value))}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateMonthlyTarget} 
                  size="sm" 
                  className="w-full sm:w-auto h-[42px]"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="section-header px-4 py-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                Classes
              </h3>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4 items-end">
                <Input
                  type="date"
                  label="Date"
                  value={classDate}
                  onChange={(e) => setClassDate(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddClass} 
                  size="sm" 
                  className="w-full sm:w-auto h-[42px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </div>
              
              <div className="scrollable-list border border-gray-700/30 rounded-lg bg-gray-900/20">
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">No classes recorded</p>
                ) : (
                  classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="list-item-light flex items-center justify-between p-3"
                    >
                      <span className="text-sm text-gray-300">{new Date(cls.date).toLocaleDateString()}</span>
                      <span className="text-sm text-green-400 font-medium">{cls.completed_count} class</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Payments Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="section-header px-4 py-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                <DollarSign className="w-4 h-4" />
                Payments
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
              <Button onClick={handleAddPayment} className="w-full mb-4" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
              
              <div className="scrollable-list border border-gray-700/30 rounded-lg bg-gray-900/20">
                {payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">No payments recorded</p>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="list-item-light flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-200">৳{payment.amount}</p>
                        <p className="text-xs text-gray-500">
                          {payment.month} {payment.year}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="section-header px-4 py-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                <StickyNote className="w-4 h-4" />
                Notes
              </h3>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 mb-4 items-end">
                <Input
                  type="text"
                  label="Note"
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button 
                  onClick={handleAddNote} 
                  size="sm" 
                  className="w-full sm:w-auto h-[42px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <div className="scrollable-list border border-gray-700/30 rounded-lg bg-gray-900/20">
                {notes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">No notes yet</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="list-item-light flex items-start justify-between p-3"
                    >
                      <p className="flex-1 text-sm text-gray-300 leading-relaxed">{note.note_text}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-500 hover:text-red-400 ml-3 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
