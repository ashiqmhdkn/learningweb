'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
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
      try { setData(JSON.parse(cached)); setLoading(false); return; } catch (_) { }
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
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                {data?.user?.username ? `Hello, ${data.user.username}` : 'Dashboard'}
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                You have {data?.batches.length ?? 0} active {data?.batches.length === 1 ? 'batch' : 'batches'} enrolled
              </p>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-700 hover:text-yellow-400 transition"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 bg-gray-800 h-[100px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl p-5  border border-gray-700 hover:shadow-lg transition" style={{ background: 'rgba(227, 225, 225, 0.05)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-700">
                    <Icon size={18} color={color} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {label}
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Courses */}
        {!loading && data && data.batches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Your Batches</h2>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-4 grid-cols-2 gap-6">
              {data.courses.map((course) => (
                <Link
                  key={course.course_id}
                  href={`/courses/${course.course_id}`}
                  className="rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 hover:shadow-lg transition block"
                >
                  {/* Image */}
                  <div className="h-36 relative overflow-hidden bg-gray-900">
                    {course.course_image ? (
                      <img
                        src={course.course_image}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap size={36} className="text-gray-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      Explore <ChevronRight size={14} />
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
            <GraduationCap size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No batches enrolled yet</p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
