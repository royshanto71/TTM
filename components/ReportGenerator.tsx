import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Class, Payment, Note } from '@/types';

interface ReportGeneratorProps {
  student: Student;
  classes: Class[];
  payments: Payment[];
  notes: Note[];
}

export const generateStudentReport = ({ student, classes, payments, notes }: ReportGeneratorProps) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // Indigo-500
  doc.text('Tuition Management System', 105, 15, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Student Report', 105, 25, { align: 'center' });

  // Student Details
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Name: ${student.name}`, 14, 40);
  doc.text(`Class: ${student.class}`, 14, 48);
  doc.text(`Contact: ${student.contact}`, 14, 56);
  doc.text(`Monthly Fee: ${student.fees_per_month} BDT`, 14, 64);
  doc.text(`Target Classes: ${student.monthly_target_classes}`, 14, 72);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 80);

  // Summary Stats
  const totalClasses = classes.reduce((sum, c) => sum + c.completed_count, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  
  doc.text(`Total Classes Completed: ${totalClasses}`, 120, 40);
  doc.text(`Total Payments Made: ${totalPayments} BDT`, 120, 48);

  let yPos = 90;

  // Classes Table
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Class History', 14, yPos);
  yPos += 5;

  const classRows = classes.map(c => [
    new Date(c.date).toLocaleDateString(),
    c.completed_count.toString(),
    // c.notes || '-' // Removed notes from Class type
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Classes Completed']],
    body: classRows,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Payments Table
  doc.setFontSize(14);
  doc.text('Payment History', 14, yPos);
  yPos += 5;

  const paymentRows = payments.map(p => [
    new Date(p.date).toLocaleDateString(),
    `${p.month} ${p.year}`,
    `${p.amount} BDT`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Month/Year', 'Amount']],
    body: paymentRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Green-500
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Notes Section
  if (notes.length > 0) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Notes', 14, yPos);
    yPos += 5;

    const noteRows = notes.map(n => [
      new Date(n.created_at).toLocaleDateString(),
      n.note_text
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Note']],
      body: noteRows,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }, // Amber-500
      columnStyles: { 1: { cellWidth: 130 } } // Wider column for note text
    });
  }

  // Save
  doc.save(`${student.name.replace(/\s+/g, '_')}_Report.pdf`);
};
