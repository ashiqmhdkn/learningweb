'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/Appshell';
import { profileApi, ParsedData } from '@/api/api';
import {
  BookOpen, Video, FileText, GraduationCap,
  TrendingUp, Clock, ChevronRight, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const cached = localStorage.getItem('cl_data');
    if (cached) {
      try { setData(JSON.parse(cached)); setLoading(false); return; } catch (_) {}
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('cl_token');
    if (!token) { router.push('/login'); return; }
    try {
      const d = await profileApi(token);
      localStorage.setItem('cl_data', JSON.stringify(d));
      setData(d);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Unauthorized')) {
        localStorage.clear(); router.push('/login');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = data
    ? [
        { label: 'Batches', value: data.batches.length, icon: GraduationCap, color: '#C9A84C' },
        { label: 'Courses', value: data.courses.length, icon: BookOpen, color: '#63B3ED' },
        { label: 'Subjects', value: data.subjects.length, icon: TrendingUp, color: '#68D391' },
        { label: 'Videos', value: data.videos.length, icon: Video, color: '#F6AD55' },
        { label: 'Notes', value: data.notes.length, icon: FileText, color: '#FC8181' },
        { label: 'Units', value: data.units.length, icon: Clock, color: '#B794F4' },
      ]
    : [];

  return (
    <AppShell>
      <div className="p-6 lg:pt-10 w-full mx-auto">
        {/* Header */}
        <div className="mb-10 fade-up fade-up-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white">
                {data?.user?.username ? `Hello, ${data.user.username}` : 'Dashboard'}
              </h1>
              <p className="text-slate-soft mt-2 text-sm">
                You have {data?.batches.length ?? 0} active {data?.batches.length === 1 ? 'batch' : 'batches'} enrolled
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-soft hover:text-gold transition-colors"
              style={{ border: '1px solid rgba(42,47,58,0.6)' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', color: '#FC8181' }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 shimmer" style={{ background: '#1C202E', height: 100 }} />
            ))}
          </div>
        )}

        {/* Stats grid */}
        {!loading && data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {stats.map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                className={`rounded-2xl p-5 card-hover fade-up fade-up-${Math.min(i + 2, 5)}`}
                style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span className="text-xs badge badge-gold">{label}</span>
                </div>
                <p className="text-3xl font-bold text-white font-display">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Batches */}
        {!loading && data && data.batches.length > 0 && (
          <div className="fade-up fade-up-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-white">Your Batches</h2>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-4 grid-cols-3 gap-6">
              {data.courses.map((course) => (
                <Link
                key={course.course_id}
                  href={`/courses/${course.course_id}`}
                  className="rounded-2xl overflow-hidden p-16 card-hover block "
                  style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}
                >
                  {/* Image */}
                  <div className="h-36 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1500, #242840)' }}>
                    {course.course_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.course_image} alt={course.title} className=" h-[300] object-cover opacity-80 aspect-16/9" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap size={36} color="rgba(201,168,76,0.3)" />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(28,32,46,1) 0%, transparent 60%)' }} />
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">{course.title}</h3>
                    <div className="flex items-center justify-between">
                        Explore <ChevronRight size={11} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && data && data.batches.length === 0 && (
          <div className="text-center py-20">
            <GraduationCap size={48} color="rgba(138,149,168,0.3)" className="mx-auto mb-4" />
            <p className="text-slate-soft">No batches enrolled yet</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
