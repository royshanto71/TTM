'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { Plus, Search, Trash2, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Payment, Student } from '@/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    amount: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    date: new Date().toISOString().split('T')[0],
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter payments based on search query
    if (searchQuery) {
      const filtered = payments.filter((p) => {
        const student = students.find((s) => s.id === p.student_id);
        return (
          student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.year.toString().includes(searchQuery)
        );
      });
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  }, [searchQuery, payments, students]);

  async function fetchData() {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('name'),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setPayments(paymentsRes.data || []);
      setFilteredPayments(paymentsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('payments').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        student_id: '',
        amount: 0,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  }

  function getStudentName(studentId: string) {
    return students.find((s) => s.id === studentId)?.name || 'Unknown';
  }

  // Calculate stats
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const thisMonthPayments = filteredPayments.filter(
    (p) => p.month === currentMonth && p.year === currentYear
  );
  const thisMonthAmount = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading payments...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Payments</h1>
            <p className="text-gray-400">Track student fee payments</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Add Payment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg gradient-success">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-green-400">৳{thisMonthAmount}</p>
                <p className="text-xs text-gray-500">{thisMonthPayments.length} payments</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg gradient-primary">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Collected</p>
                <p className="text-2xl font-bold">৳{totalAmount}</p>
                <p className="text-xs text-gray-500">{filteredPayments.length} payments</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by student, month, or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-12">
              {searchQuery ? 'No payments found' : 'No payments yet. Add your first payment!'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} hover>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold mb-1">
                      {getStudentName(payment.student_id)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {payment.month} {payment.year}
                      </div>
                      <span>•</span>
                      <span>Paid on {new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">৳{payment.amount}</p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeletePayment(payment.id)}
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

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Payment Record"
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
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
            label="Amount (৳)"
            type="number"
            required
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <select
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Year"
              type="number"
              required
              min="2020"
              max="2100"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
            />
          </div>
          <Input
            label="Payment Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
              Add Payment
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
