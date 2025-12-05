'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Modal from './Modal';
import { Student, Class, Payment, Note } from '@/types';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Edit, 
  X, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CalendarDays, 
  CreditCard, 
  FileText,
  Trash2,
  Save
} from 'lucide-react';
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

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: student.name,
    class: student.class,
    contact: student.contact,
    fees_per_month: student.fees_per_month,
  });

  // Form states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paymentAmount, setPaymentAmount] = useState(student.fees_per_month);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteText, setNoteText] = useState('');

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
      setEditForm({
        name: student.name,
        class: student.class,
        contact: student.contact,
        fees_per_month: student.fees_per_month,
      });
      setIsEditing(false);
    }
  }, [isOpen, fetchStudentData, student]);

  async function handleSaveStudent() {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editForm.name,
          class: editForm.class,
          contact: editForm.contact,
          fees_per_month: editForm.fees_per_month,
        })
        .eq('id', student.id);

      if (error) throw error;
      
      setIsEditing(false);
      onUpdate(); // Refresh parent list
      // Note: student prop won't update immediately unless parent re-renders and passes new prop
      // We might need to rely on parent update or local optimistic update if needed.
      // For now, assuming onUpdate triggers a re-fetch in parent.
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student details');
    }
  }

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start

    const days = [];
    // Previous month filler
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const getClassForDate = (date: Date) => {
    return classes.find(c => {
      const cDate = new Date(c.date);
      return cDate.getDate() === date.getDate() &&
             cDate.getMonth() === date.getMonth() &&
             cDate.getFullYear() === date.getFullYear();
    });
  };

  async function handleDateClick(date: Date) {
    const existingClass = getClassForDate(date);
    const dateStr = date.toISOString().split('T')[0];

    try {
      if (existingClass) {
        // Remove class
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', existingClass.id);
        
        if (error) throw error;
      } else {
        // Add class
        const { error } = await supabase.from('classes').insert([
          {
            student_id: student.id,
            date: dateStr,
            completed_count: 1,
          },
        ]);

        if (error) throw error;
      }
      fetchStudentData();
      onUpdate();
    } catch (error) {
      console.error('Error toggling class:', error);
      alert('Failed to update class');
    }
  }

  async function handleAddClass() {
    // Keep this for the "Add Class" button, defaulting to today
    const dateStr = new Date().toISOString().split('T')[0];
    // Check if class already exists for today to avoid duplicates if using button
    const today = new Date();
    if (getClassForDate(today)) {
        alert('Class already marked for today.');
        return;
    }

    try {
      const { error } = await supabase.from('classes').insert([
        {
          student_id: student.id,
          date: dateStr,
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

  async function handleStartNewMonth() {
    if (!confirm('Start a new month? This will reset completed classes.')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('student_id', student.id);

      if (error) throw error;
      fetchStudentData();
      onUpdate();
    } catch (error) {
      console.error('Error starting new month:', error);
      alert('Failed to start new month');
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId);

      if (error) throw error;
      fetchStudentData();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  }

  // Stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthClasses = classes.filter((c) => {
    const classDate = new Date(c.date);
    return classDate.getMonth() === currentMonth && classDate.getFullYear() === currentYear;
  });
  const completedThisMonth = monthClasses.reduce((sum, c) => sum + c.completed_count, 0);
  const progressPercentage = Math.min((completedThisMonth / student.monthly_target_classes) * 100, 100);
  
  const lastPayment = payments.length > 0 ? payments[0] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-light dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto font-display">
        
        {/* Header */}
        <div className="p-4 border-b border-subtle-light dark:border-subtle-dark sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-primary-DEFAULT focus:outline-none w-full mr-4"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
            )}
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button 
                  onClick={handleSaveStudent}
                  className="flex items-center gap-2 text-sm font-semibold bg-accent-green text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-sm font-semibold bg-primary-DEFAULT text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button 
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <main className="p-4 space-y-6">
          {/* Student Details Section */}
          <section className="bg-surface-light dark:bg-surface-dark p-1 rounded-xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Details</h2>
                <p className="text-sm text-muted-light dark:text-muted-dark">Personal and fee information</p>
              </div>
              <button 
                onClick={() => generateStudentReport({ student, classes, payments, notes })}
                className="flex items-center gap-1.5 text-sm text-muted-light dark:text-muted-dark hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Report
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-light dark:text-muted-dark">Class</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.class}
                    onChange={(e) => setEditForm({...editForm, class: e.target.value})}
                    className="font-medium text-gray-800 dark:text-gray-200 bg-subtle-light dark:bg-subtle-dark rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-gray-200">{student.class}</p>
                )}
              </div>
              <div>
                <p className="text-muted-light dark:text-muted-dark">Contact</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.contact}
                    onChange={(e) => setEditForm({...editForm, contact: e.target.value})}
                    className="font-medium text-gray-800 dark:text-gray-200 bg-subtle-light dark:bg-subtle-dark rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-gray-200">{student.contact}</p>
                )}
              </div>
              <div>
                <p className="text-muted-light dark:text-muted-dark">Monthly Fees</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.fees_per_month}
                    onChange={(e) => setEditForm({...editForm, fees_per_month: parseFloat(e.target.value)})}
                    className="font-medium text-gray-800 dark:text-gray-200 bg-subtle-light dark:bg-subtle-dark rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-800 dark:text-gray-200">৳{student.fees_per_month}</p>
                )}
              </div>
              <div>
                <p className="text-muted-light dark:text-muted-dark">Last Paid</p>
                <p className="font-medium text-accent-green">
                  {lastPayment ? `৳${lastPayment.amount}` : '-'}
                </p>
              </div>
            </div>
          </section>

          {/* Monthly Progress Section */}
          <section className="bg-surface-light dark:bg-surface-dark p-1 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Progress</h2>
              <button 
                onClick={handleStartNewMonth}
                className="text-sm bg-subtle-light dark:bg-subtle-dark text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Start New Month
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-light dark:text-muted-dark">Classes Completed</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {completedThisMonth} / {student.monthly_target_classes}
                </span>
              </div>
              <div className="w-full bg-subtle-light dark:bg-subtle-dark rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-start to-primary-end h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {/* Classes Accordion */}
            <details className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden" open>
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-primary-DEFAULT w-6 h-6" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Classes</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-light dark:text-muted-dark transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 space-y-4 border-t border-subtle-light dark:border-subtle-dark pt-4">
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark w-5 h-5" />
                  <input 
                    className="w-full bg-subtle-light dark:bg-subtle-dark border-0 rounded-md pl-10 pr-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    type="text" 
                    readOnly
                    value={currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  />
                </div>
                <button 
                  onClick={handleAddClass}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-start to-primary-end text-white font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Add Class
                </button>
                
                {/* Calendar View */}
                <div className="text-center">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                      className="p-2 rounded-full hover:bg-subtle-light dark:hover:bg-subtle-dark text-muted-light dark:text-muted-dark transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button 
                      onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                      className="p-2 rounded-full hover:bg-subtle-light dark:hover:bg-subtle-dark text-muted-light dark:text-muted-dark transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-y-2 text-sm">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                      <div key={day} className="font-medium text-muted-light dark:text-muted-dark">{day}</div>
                    ))}
                    
                    {calendarDays.map((date, i) => {
                      const hasClass = date ? getClassForDate(date) : false;
                      return (
                        <div key={i} className="relative h-8 flex items-center justify-center">
                          {date && (
                            <button
                              onClick={() => handleDateClick(date)}
                              className={`
                                w-8 h-8 flex flex-col items-center justify-center rounded-full text-sm transition-all
                                ${hasClass 
                                  ? 'bg-subtle-light dark:bg-subtle-dark text-gray-900 dark:text-white font-bold' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-subtle-light dark:hover:bg-subtle-dark'}
                              `}
                            >
                              <span>{date.getDate()}</span>
                              {hasClass && (
                                <span className="w-1 h-1 bg-primary-DEFAULT rounded-full mt-0.5"></span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>

            {/* Payments Accordion */}
            <details className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-primary-DEFAULT w-6 h-6" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-light dark:text-muted-dark transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 space-y-4 border-t border-subtle-light dark:border-subtle-dark pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-light dark:text-muted-dark mb-1" htmlFor="amount">Amount (৳)</label>
                    <input 
                      className="w-full bg-subtle-light dark:bg-subtle-dark border-0 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                      id="amount" 
                      type="number" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-light dark:text-muted-dark mb-1" htmlFor="date">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark w-4 h-4 pointer-events-none" />
                      <input 
                        className="w-full bg-subtle-light dark:bg-subtle-dark border-0 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                        id="date" 
                        type="date" 
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleAddPayment}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-start to-primary-end text-white font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Add Payment
                </button>
                <ul className="space-y-2">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex justify-between items-center p-3 bg-subtle-light dark:bg-subtle-dark rounded-md">
                      <span className="font-semibold text-gray-900 dark:text-white text-lg">৳{payment.amount}</span>
                      <span className="text-sm text-muted-light dark:text-muted-dark">
                        {new Date(payment.date).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            {/* Notes Accordion */}
            <details className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary-DEFAULT w-6 h-6" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-light dark:text-muted-dark transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 space-y-4 border-t border-subtle-light dark:border-subtle-dark pt-4">
                <div>
                  <label className="block text-sm font-medium text-muted-light dark:text-muted-dark mb-1" htmlFor="note">Note</label>
                  <textarea 
                    className="w-full bg-subtle-light dark:bg-subtle-dark border-0 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    id="note" 
                    placeholder="Add a note..." 
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  ></textarea>
                </div>
                <button 
                  onClick={handleAddNote}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-start to-primary-end text-white font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Add Note
                </button>
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="p-3 bg-subtle-light dark:bg-subtle-dark rounded-md">
                      <p className="text-gray-800 dark:text-gray-200">{note.note_text}</p>
                      <div className="flex justify-end items-center mt-2 gap-2 text-muted-light dark:text-muted-dark">
                        <button className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded-full text-accent-red hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </main>
      </div>
    </div>
  );
}
