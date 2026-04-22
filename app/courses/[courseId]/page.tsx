'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
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
          <Link href="/courses" className="text-gold text-sm mt-3 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to courses
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        {/* Back */}
        <Link href="/courses" className="inline-flex items-center gap-2 text-slate-soft hover:text-gold text-sm mb-6 transition-colors fade-up fade-up-1">
          <ArrowLeft size={15} /> All Courses
        </Link>

        {/* Course header */}
        <div className="rounded-2xl overflow-hidden mb-8 fade-up fade-up-2" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
          <center>{course.title}</center>
        </div>
        {/* YouTube Style Subjects Grid */}
        <div className="fade-up fade-up-3">
          <h2 className="font-display text-xl font-bold text-white mb-6">
            Subjects
          </h2>
        
          <div className="grid grid-cols-3 sm:grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => {
              const units: Unit[] =
                data?.units.filter((u) => u.subject_id === subject.subject_id) ?? [];

              return (
                <Link
                  key={subject.subject_id}
                  href={`/courses/${courseId}/subject/${subject.subject_id}`}
                  className="group"
                >
                  <div className="bg-neutral-primary-soft block max-w-sm p-6  rounded-base shadow-xs">
                    <center>
                      <img className="rounded-base h-[360]" src={subject.subject_image} alt={subject.title} />
                    <h5 className="mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading">{subject.title}</h5>
                    </center>
                  </div>

                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
