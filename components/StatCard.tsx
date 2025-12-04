'use client';

import { ReactNode } from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  variant = 'primary',
  subtitle 
}: StatCardProps) {
  const variants = {
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning',
    danger: 'gradient-danger',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-400 text-xs md:text-sm mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold mb-1 truncate">{value}</h3>
          {subtitle && (
            <p className="text-gray-500 text-xs truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 md:p-3 rounded-lg ${variants[variant]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${variants[variant]}`} />
    </Card>
  );
}
