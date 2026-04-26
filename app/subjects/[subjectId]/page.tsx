'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import { ParsedData, profileApi, Unit, Video, Note } from '@/api/api';
import { ArrowLeft, Video as VideoIcon, FileText, Download, Play, Clock } from 'lucide-react';

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cached = localStorage.getItem('cl_data');
    if (cached) {
      try { 
        const d = JSON.parse(cached);
        setData(d);
        // Auto-select first video
        const u = d.units.find((un: Unit) => un.subject_id === subjectId);
        setLoading(false);
        return;
      } catch (_) {}
    }
    const token = localStorage.getItem('cl_token');
    if (!token) { router.push('/login'); return; }
    profileApi(token)
      .then((d) => { 
        localStorage.setItem('cl_data', JSON.stringify(d)); 
        setData(d);
        const u = d.units.find((un) => un.subject_id === subjectId);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, subjectId]);

  const units: Unit []| undefined = data?.units.filter((u) => u.subject_id === subjectId)??[];

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-10">
          <div className="shimmer rounded-2xl mb-6" style={{ height: 400, background: '#1C202E' }} />
        </div>
      </AppShell>
    );
  }

  if (!units) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          <p className="text-slate-soft">Unit not found</p>
          <Link href={`/dashboard`} className="text-gold text-sm mt-3 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 w-full mx-auto">
        {/* Back */}
        <Link 
          href={`/dashboard`} 
          className="inline-flex items-center gap-2 text-slate-soft hover:text-gold text-sm mb-6 transition-colors fade-up fade-up-1"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>
        <div className="fade-up fade-up-3">
          <h2 className="font-display text-xl font-bold text-white mb-6">
            Subjects
          </h2>
        
          <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {units.map((unit) => {
              const units: Unit[] =
                data?.units.filter((u) => u.subject_id === unit.subject_id) ?? [];

              return (
                <Link
                  key={unit.unit_id}
                  href={`/units/${unit.unit_id}`}
                  className="group"
                >
                  <div className="bg-blue-500 block max-w-sm p-6  rounded-base shadow-xs">
                    <center>
                      <div className='overflow-hidden h-36 relative'>
                      <img className="object-cover squre h-[300]" src={unit.unit_image} alt={unit.title} />
                    </div>
                    <h5 className="mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading">{unit.title}</h5>
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
