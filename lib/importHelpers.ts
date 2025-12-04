import { supabase } from './supabase';

// Define the structure of the import data
export interface ImportData {
  students?: Array<{
    name: string;
    class: string;
    contact: string;
    monthly_target_classes: number;
    fees_per_month: number;
  }>;
  classes?: Array<{
    student_name: string;
    date: string;
    completed_count: number;
  }>;
  payments?: Array<{
    student_name: string;
    amount: number;
    date: string;
    month: string;
    year: number;
  }>;
  notes?: Array<{
    student_name: string;
    note_text: string;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
  index?: number;
  section?: string;
}

// Generate and download JSON template
export function generateTemplate() {
  const template: ImportData = {
    students: [
      {
        name: "John Doe",
        class: "Grade 10",
        contact: "01712345678",
        monthly_target_classes: 8,
        fees_per_month: 2000
      },
      {
        name: "Jane Smith",
        class: "Grade 9",
        contact: "01798765432",
        monthly_target_classes: 10,
        fees_per_month: 2500
      }
    ],
    classes: [
      {
        student_name: "John Doe",
        date: "2024-01-15",
        completed_count: 1
      },
      {
        student_name: "Jane Smith",
        date: "2024-01-15",
        completed_count: 1
      }
    ],
    payments: [
      {
        student_name: "John Doe",
        amount: 2000,
        date: "2024-01-01",
        month: "January",
        year: 2024
      },
      {
        student_name: "Jane Smith",
        amount: 2500,
        date: "2024-01-01",
        month: "January",
        year: 2024
      }
    ],
    notes: [
      {
        student_name: "John Doe",
        note_text: "Excellent progress in mathematics"
      },
      {
        student_name: "Jane Smith",
        note_text: "Needs improvement in physics"
      }
    ]
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'import-template.json';
  link.click();
  URL.revokeObjectURL(url);
}

// Validate import data structure and required fields
export function validateImportData(data: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'Invalid JSON structure. Expected an object.' });
    return { valid: false, errors };
  }

  // Validate students (optional but if present, must be valid)
  if (data.students && Array.isArray(data.students)) {
    data.students.forEach((student: any, index: number) => {
      if (!student.name || typeof student.name !== 'string') {
        errors.push({ field: 'name', message: 'Student name is required', index, section: 'students' });
      }
      if (student.monthly_target_classes !== undefined && typeof student.monthly_target_classes !== 'number') {
        errors.push({ field: 'monthly_target_classes', message: 'Must be a number', index, section: 'students' });
      }
      if (student.fees_per_month !== undefined && typeof student.fees_per_month !== 'number') {
        errors.push({ field: 'fees_per_month', message: 'Must be a number', index, section: 'students' });
      }
    });
  } else if (data.students !== undefined && !Array.isArray(data.students)) {
    errors.push({ field: 'students', message: 'Students must be an array' });
  }

  // Validate classes
  if (data.classes && Array.isArray(data.classes)) {
    data.classes.forEach((classItem: any, index: number) => {
      if (!classItem.student_name) {
        errors.push({ field: 'student_name', message: 'Student name is required', index, section: 'classes' });
      }
      if (!classItem.date) {
        errors.push({ field: 'date', message: 'Date is required', index, section: 'classes' });
      }
      if (classItem.completed_count !== undefined && typeof classItem.completed_count !== 'number') {
        errors.push({ field: 'completed_count', message: 'Must be a number', index, section: 'classes' });
      }
    });
  } else if (data.classes !== undefined && !Array.isArray(data.classes)) {
    errors.push({ field: 'classes', message: 'Classes must be an array' });
  }

  // Validate payments
  if (data.payments && Array.isArray(data.payments)) {
    data.payments.forEach((payment: any, index: number) => {
      if (!payment.student_name) {
        errors.push({ field: 'student_name', message: 'Student name is required', index, section: 'payments' });
      }
      if (!payment.amount || typeof payment.amount !== 'number') {
        errors.push({ field: 'amount', message: 'Amount is required and must be a number', index, section: 'payments' });
      }
      if (!payment.date) {
        errors.push({ field: 'date', message: 'Date is required', index, section: 'payments' });
      }
    });
  } else if (data.payments !== undefined && !Array.isArray(data.payments)) {
    errors.push({ field: 'payments', message: 'Payments must be an array' });
  }

  // Validate notes
  if (data.notes && Array.isArray(data.notes)) {
    data.notes.forEach((note: any, index: number) => {
      if (!note.student_name) {
        errors.push({ field: 'student_name', message: 'Student name is required', index, section: 'notes' });
      }
      if (!note.note_text) {
        errors.push({ field: 'note_text', message: 'Note text is required', index, section: 'notes' });
      }
    });
  } else if (data.notes !== undefined && !Array.isArray(data.notes)) {
    errors.push({ field: 'notes', message: 'Notes must be an array' });
  }

  return { valid: errors.length === 0, errors };
}

// Bulk insert data to Supabase
export async function bulkInsertData(data: ImportData) {
  const results = {
    students: { success: 0, failed: 0, errors: [] as string[] },
    classes: { success: 0, failed: 0, errors: [] as string[] },
    payments: { success: 0, failed: 0, errors: [] as string[] },
    notes: { success: 0, failed: 0, errors: [] as string[] },
  };

  try {
    // Step 1: Insert students first and create name-to-ID mapping
    const studentNameToId = new Map<string, string>();

    if (data.students && data.students.length > 0) {
      const { data: insertedStudents, error: studentsError } = await supabase
        .from('students')
        .insert(data.students)
        .select('id, name');

      if (studentsError) {
        results.students.failed = data.students.length;
        results.students.errors.push(studentsError.message);
      } else if (insertedStudents) {
        results.students.success = insertedStudents.length;
        // Create mapping
        insertedStudents.forEach((student: any) => {
          studentNameToId.set(student.name, student.id);
        });
      }
    }

    // Also fetch existing students to map their names
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id, name');

    if (existingStudents) {
      existingStudents.forEach((student: any) => {
        if (!studentNameToId.has(student.name)) {
          studentNameToId.set(student.name, student.id);
        }
      });
    }

    // Step 2: Insert classes with student_id mapping
    if (data.classes && data.classes.length > 0) {
      const classesWithIds = data.classes
        .map((classItem) => {
          const studentId = studentNameToId.get(classItem.student_name);
          if (!studentId) {
            results.classes.failed++;
            results.classes.errors.push(`Student "${classItem.student_name}" not found`);
            return null;
          }
          return {
            student_id: studentId,
            date: classItem.date,
            completed_count: classItem.completed_count || 1,
          };
        })
        .filter(Boolean);

      if (classesWithIds.length > 0) {
        const { error: classesError } = await supabase
          .from('classes')
          .insert(classesWithIds);

        if (classesError) {
          results.classes.failed += classesWithIds.length;
          results.classes.errors.push(classesError.message);
        } else {
          results.classes.success = classesWithIds.length;
        }
      }
    }

    // Step 3: Insert payments with student_id mapping
    if (data.payments && data.payments.length > 0) {
      const paymentsWithIds = data.payments
        .map((payment) => {
          const studentId = studentNameToId.get(payment.student_name);
          if (!studentId) {
            results.payments.failed++;
            results.payments.errors.push(`Student "${payment.student_name}" not found`);
            return null;
          }
          return {
            student_id: studentId,
            amount: payment.amount,
            date: payment.date,
            month: payment.month,
            year: payment.year,
          };
        })
        .filter(Boolean);

      if (paymentsWithIds.length > 0) {
        const { error: paymentsError } = await supabase
          .from('payments')
          .insert(paymentsWithIds);

        if (paymentsError) {
          results.payments.failed += paymentsWithIds.length;
          results.payments.errors.push(paymentsError.message);
        } else {
          results.payments.success = paymentsWithIds.length;
        }
      }
    }

    // Step 4: Insert notes with student_id mapping
    if (data.notes && data.notes.length > 0) {
      const notesWithIds = data.notes
        .map((note) => {
          const studentId = studentNameToId.get(note.student_name);
          if (!studentId) {
            results.notes.failed++;
            results.notes.errors.push(`Student "${note.student_name}" not found`);
            return null;
          }
          return {
            student_id: studentId,
            note_text: note.note_text,
          };
        })
        .filter(Boolean);

      if (notesWithIds.length > 0) {
        const { error: notesError } = await supabase
          .from('notes')
          .insert(notesWithIds);

        if (notesError) {
          results.notes.failed += notesWithIds.length;
          results.notes.errors.push(notesError.message);
        } else {
          results.notes.success = notesWithIds.length;
        }
      }
    }

    return results;
  } catch (error: any) {
    throw new Error(`Import failed: ${error.message}`);
  }
}
