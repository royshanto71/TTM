'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]', // Touch-friendly minimum
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };
  
  const variants = {
    primary: 'gradient-primary text-white hover:shadow-lg hover:shadow-indigo-500/50 active:scale-95',
    success: 'gradient-success text-white hover:shadow-lg hover:shadow-green-500/50 active:scale-95',
    warning: 'gradient-warning text-white hover:shadow-lg hover:shadow-orange-500/50 active:scale-95',
    danger: 'gradient-danger text-white hover:shadow-lg hover:shadow-red-500/50 active:scale-95',
    ghost: 'bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 active:scale-95',
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

