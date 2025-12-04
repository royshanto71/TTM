'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DollarSign,
  StickyNote,
  LogOut,
  Menu,
  FileUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Button from './Button';

interface LayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/students', icon: Users, label: 'Students' },
    { href: '/classes', icon: BookOpen, label: 'Classes' },
    { href: '/payments', icon: DollarSign, label: 'Payments' },
    { href: '/notes', icon: StickyNote, label: 'Notes' },
    { href: '/import', icon: FileUp, label: 'Import' },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen pb-16 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-[var(--border)] z-40 flex items-center justify-between px-4">
        <div>
          <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
            TMS
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-target text-gray-400 hover:text-white"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:block w-64 glass border-r border-[var(--border)] p-6 fixed h-screen z-50">
        <div className="mb-8">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            TMS
          </h1>
          <p className="text-sm text-gray-400 mt-1">Tuition Management</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 touch-target
                  ${isActive 
                    ? 'gradient-primary text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-[var(--border)] z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center w-full h-full
                  transition-all duration-200
                  ${isActive 
                    ? 'text-indigo-400' 
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-0 p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


