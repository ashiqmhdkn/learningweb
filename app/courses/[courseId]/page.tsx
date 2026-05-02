'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import { ParsedData, profileApi, Course, Subject, Unit } from '@/api/api';
import { ChevronDown, ChevronRight, Video, FileText, Layers, ArrowLeft, BookOpen } from 'lucide-react';

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const cached = localStorage.getItem('cl_data');
    if (cached) {
      try { setData(JSON.parse(cached)); setLoading(false); return; } catch (_) { }
    }
    const token = localStorage.getItem('cl_token');
    if (!token) { router.push('/login'); return; }
    profileApi(token)
      .then((d) => { localStorage.setItem('cl_data', JSON.stringify(d)); setData(d); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const course: Course | undefined = data?.courses.find((c) => c.course_id === courseId);
  const subjects: Subject[] = data?.subjects.filter((s) => s.course_id === courseId) ?? [];

  const toggleSubject = (id: string) => {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-10 max-w-4xl mx-auto">
          <div className="shimmer rounded-2xl mb-6" style={{ height: 120, background: '#1C202E' }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shimmer rounded-xl mb-3" style={{ height: 60, background: '#1C202E' }} />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          <BookOpen size={48} color="rgba(138,149,168,0.3)" className="mx-auto mb-4" />
          <p className="text-slate-soft">Course not found</p>
          <button onClick={() => router.back()} className="text-gold text-sm mt-3 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:pt-0 w-full mx-auto">

        {/* Header (Dashboard Style) */}
        <div className="mb-10">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-yellow-400 transition"
              >
                <ArrowLeft size={16} />
              </button>

              <div>
                <h1 className="text-2xl lg:text-4xl font-bold text-white">
                  {course.title}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  {subjects.length} subjects available
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Subjects Section */}
        <div>



          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.subject_id}
                href={`/subjects/${subject.subject_id}`}
                className="rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 hover:shadow-lg transition block"
              >

                {/* Image */}
                <div className="h-40 relative overflow-hidden">
                  {subject.subject_image ? (
                    <img
                      src={subject.subject_image}
                      alt={subject.title}
                      className="w-full h-full object-fit"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers size={32} className="text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 " />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm truncate">
                    {subject.title}
                  </h3>


                </div>

              </Link>
            ))}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
