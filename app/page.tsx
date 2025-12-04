'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { Users, BookOpen, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Student, Class, Payment } from '@/types';

interface DashboardStats {
  totalStudents: number;
  completedClassesToday: number;
  completedClassesMonth: number;
  pendingFeesCount: number;
  paidFeesCount: number;
  totalMonthlyTarget: number;
  totalMonthlyCompleted: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    completedClassesToday: 0,
    completedClassesMonth: 0,
    pendingFeesCount: 0,
    paidFeesCount: 0,
    totalMonthlyTarget: 0,
    totalMonthlyCompleted: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Get all students
      const { data: students } = await supabase
        .from('students')
        .select('*');

      // Get today's classes
      const today = new Date().toISOString().split('T')[0];
      const { data: todayClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('date', today);

      // Get this month's classes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: monthClasses } = await supabase
        .from('classes')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      // Get recent payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const totalStudents = students?.length || 0;
      const completedClassesToday = todayClasses?.reduce((sum, c) => sum + c.completed_count, 0) || 0;
      const completedClassesMonth = monthClasses?.reduce((sum, c) => sum + c.completed_count, 0) || 0;
      const totalMonthlyTarget = students?.reduce((sum, s) => sum + s.monthly_target_classes, 0) || 0;

      // Calculate fees status (simplified - checking if payment exists for current month)
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      const { data: currentMonthPayments } = await supabase
        .from('payments')
        .select('student_id')
        .eq('month', currentMonth)
        .eq('year', currentYear);

      const paidStudentIds = new Set(currentMonthPayments?.map(p => p.student_id) || []);
      const paidFeesCount = paidStudentIds.size;
      const pendingFeesCount = totalStudents - paidFeesCount;

      setStats({
        totalStudents,
        completedClassesToday,
        completedClassesMonth,
        pendingFeesCount,
        paidFeesCount,
        totalMonthlyTarget,
        totalMonthlyCompleted: completedClassesMonth,
      });

      setRecentPayments(payments || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm md:text-base">Welcome back! Here&apos;s your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<Users className="w-6 h-6 text-white" />}
            variant="primary"
          />
          <StatCard
            title="Classes Today"
            value={stats.completedClassesToday}
            icon={<BookOpen className="w-6 h-6 text-white" />}
            variant="success"
            subtitle={`${stats.completedClassesMonth} this month`}
          />
          <StatCard
            title="Pending Fees"
            value={stats.pendingFeesCount}
            icon={<AlertCircle className="w-6 h-6 text-white" />}
            variant="warning"
          />
          <StatCard
            title="Paid Fees"
            value={stats.paidFeesCount}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            variant="success"
          />
        </div>

        {/* Progress Section */}
        <Card>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Monthly Progress</h2>
          <ProgressBar
            current={stats.totalMonthlyCompleted}
            target={stats.totalMonthlyTarget}
            label="Total Classes Target"
            variant="primary"
          />
        </Card>

        {/* Recent Payments */}
        <Card>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Recent Payments</h2>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm md:text-base">No recent payments</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">{payment.students?.name}</p>
                    <p className="text-xs md:text-sm text-gray-400">
                      {payment.month} {payment.year}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="font-bold text-green-400 text-sm md:text-base">৳{payment.amount}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
