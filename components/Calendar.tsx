'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Class, Student } from '@/types';

interface CalendarProps {
  classes: Class[];
  students: Student[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string | null;
}

export default function Calendar({ classes, students, onDateSelect, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get classes for a specific date
  const getClassesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return classes.filter(c => c.date === dateStr);
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  // Handle date click
  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect?.(dateStr);
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayClasses = getClassesForDate(day);
    const hasClasses = dayClasses.length > 0;
    const todayClass = isToday(day);
    const selectedClass = isSelected(day);

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          aspect-square p-2 rounded-lg relative transition-all duration-200
          hover:scale-105 active:scale-95
          ${todayClass 
            ? 'ring-2 ring-indigo-400 bg-indigo-500/10' 
            : ''
          }
          ${selectedClass 
            ? 'bg-indigo-500/20 ring-2 ring-indigo-300' 
            : 'hover:bg-gray-800/50'
          }
          ${hasClasses 
            ? 'font-bold' 
            : 'text-gray-400'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className={`text-sm md:text-base ${hasClasses ? 'text-white' : ''}`}>
            {day}
          </span>
          {hasClasses && (
            <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
              {dayClasses.slice(0, 3).map((_, idx) => (
                <div
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
                />
              ))}
              {dayClasses.length > 3 && (
                <span className="text-[8px] text-indigo-300">+{dayClasses.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs md:text-sm font-medium text-gray-400 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full ring-2 ring-indigo-400 bg-indigo-500/10" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
          <span>Has Classes</span>
        </div>
      </div>
    </div>
  );
}
