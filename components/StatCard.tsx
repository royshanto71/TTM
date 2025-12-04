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
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className="text-gray-500 text-xs">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${variants[variant]}`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${variants[variant]}`} />
    </Card>
  );
}
