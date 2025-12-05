import { createClient } from '@/lib/supabase-server';
import ClassesClient from './ClassesClient';

export default async function ClassesPage() {
  const supabase = createClient();

  const [classesRes, studentsRes] = await Promise.all([
    supabase.from('classes').select('*').order('date', { ascending: false }),
    supabase.from('students').select('*').order('name'),
  ]);

  const classes = classesRes.data || [];
  const students = studentsRes.data || [];

  return <ClassesClient initialClasses={classes} initialStudents={students} />;
}
