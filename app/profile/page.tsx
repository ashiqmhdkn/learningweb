'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/app/components/AppShell';
import { useAuth } from '@/api/auth-context';
import { User as UserIcon, Mail, Phone, Calendar, Shield, BookOpen, Video, FileText } from 'lucide-react';
import { ParsedData } from '@/api/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<ParsedData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const cached = localStorage.getItem('cl_data');
    if (cached) {
      try { setData(JSON.parse(cached)); } catch (_) {}
    }
  }, [user, router]);

  if (!user) return null;

  const stats = data
    ? [
        { label: 'Batches Enrolled', value: data.batches.length, icon: BookOpen, color: '#C9A84C' },
        { label: 'Total Videos', value: data.videos.length, icon: Video, color: '#63B3ED' },
        { label: 'Study Materials', value: data.notes.length, icon: FileText, color: '#68D391' },
      ]
    : [];

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 fade-up fade-up-1">
          <h1 className="font-display text-3xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-soft text-sm">View and manage your account details</p>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl p-8 mb-8 fade-up fade-up-2" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #7A6230)', color: '#0D0F12' }}
            >
              {(user.username || user.email || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                {user.username || 'Student'}
              </h2>
              <div className="space-y-2 mt-4">
                {user.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-soft">
                    <Mail size={16} color="#C9A84C" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-soft">
                    <Phone size={16} color="#C9A84C" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.role && (
                  <div className="flex items-center gap-3 text-sm text-slate-soft">
                    <Shield size={16} color="#C9A84C" />
                    <span className="capitalize">{user.role}</span>
                  </div>
                )}
                {user.created_at && (
                  <div className="flex items-center gap-3 text-sm text-slate-soft">
                    <Calendar size={16} color="#C9A84C" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid md:grid-cols-3 gap-5 fade-up fade-up-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={20} color={color} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white font-display mb-1">{value}</p>
                <p className="text-xs text-slate-dim">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Account info */}
        <div className="rounded-2xl p-6 mt-8 fade-up fade-up-4" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
          <h3 className="font-semibold text-white text-sm mb-4">Account Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-surface-3/30">
              <span className="text-slate-dim">User ID</span>
              <span className="text-white font-mono text-xs">{user.id}</span>
            </div>
            {user.email && (
              <div className="flex justify-between py-2 border-b border-surface-3/30">
                <span className="text-slate-dim">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
            )}
            {user.username && (
              <div className="flex justify-between py-2 border-b border-surface-3/30">
                <span className="text-slate-dim">Username</span>
                <span className="text-white">@{user.username}</span>
              </div>
            )}
            {user.role && (
              <div className="flex justify-between py-2">
                <span className="text-slate-dim">Role</span>
                <span className="badge badge-gold">{user.role}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
