'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/api/auth-context';
import {
  Moon, LayoutDashboard, BookOpen, User,
  LogOut, ChevronRight, GraduationCap, X, Menu
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-surface-3/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center crescent-ring" style={{ background: 'rgba(201,168,76,0.08)' }}>
            <Moon size={16} color="#C9A84C" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">Crescent</p>
            <p className="text-xs text-slate-dim">Learning</p>
          </div>
        </div>
      </div>

      {/* User chip */}
      {user && (
        <div className="px-4 py-4 border-b border-surface-3/40">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(36,40,64,0.5)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #7A6230)', color: '#0D0F12' }}>
              {(user.username || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username || 'Student'}</p>
              <p className="text-xs text-slate-dim truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="text-xs text-slate-dim uppercase tracking-wider px-3 mb-3">Navigation</p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group"
              style={{
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: active ? '#E8C97A' : '#8A95A8',
                border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              }}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-soft hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(19,22,32,0.9)', border: '1px solid rgba(42,47,58,0.6)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} color="#C9A84C" /> : <Menu size={18} color="#C9A84C" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="sidebar w-64 lg:hidden"
        style={{
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="sidebar w-64 hidden lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
