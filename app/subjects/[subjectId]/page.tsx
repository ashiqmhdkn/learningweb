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
      } catch (_) { }
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

  const units: Unit[] | undefined = data?.units.filter((u) => u.subject_id === subjectId) ?? [];

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
      <div className="p-6 lg:pt-0 w-full mx-auto">

        {/* Header (same pattern as Course page) */}
        <div className="mb-10">
          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-yellow-400 transition"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-white">
                Units
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {units.length} units available
              </p>
            </div>

          </div>
        </div>

        {/* Units Grid (same card system as subjects) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {units.map((unit) => (
            <Link
              key={unit.unit_id}
              href={`/units/${unit.unit_id}`}
              className="rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 hover:shadow-lg transition block"
            >

              {/* Image */}
              <div className="h-40 relative overflow-hidden">
                {unit.unit_image ? (
                  <img
                    src={unit.unit_image}
                    alt={unit.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoIcon size={32} className="text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 " />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm truncate">
                  {unit.title}
                </h3>

              </div>

            </Link>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
