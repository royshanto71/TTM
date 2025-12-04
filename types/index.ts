export interface Student {
  id: string;
  name: string;
  class: string;
  contact: string;
  monthly_target_classes: number;
  fees_per_month: number;
  created_at: string;
}

export interface Class {
  id: string;
  student_id: string;
  date: string;
  time?: string;
  completed_count: number;
  created_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  month: string;
  year: number;
  created_at: string;
}

export interface Note {
  id: string;
  student_id: string;
  note_text: string;
  created_at: string;
}

export interface StudentWithStats extends Student {
  completed_classes_today?: number;
  completed_classes_month?: number;
  total_paid?: number;
  due_amount?: number;
  last_payment_date?: string;
}
