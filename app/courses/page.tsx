'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '../components/Appshell';
import { ParsedData, profileApi } from '@/api/api';
import {
  BookOpen,
  Video,
  FileText,
  Search,
  Layers,
  Clock,
  PlayCircle,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Tiny utility: format numbers like YouTube
───────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─────────────────────────────────────────
   Skeleton card
───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="w-full aspect-video rounded-xl bg-[#272c3a]" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-[#272c3a] shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-[#272c3a] rounded w-4/5" />
          <div className="h-3 bg-[#1e2230] rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Color palette derived from course_id
───────────────────────────────────────── */
const PALETTES = [
  ['#c9a84c', '#1a1500'],
  ['#5b8dee', '#0d1528'],
  ['#e8705a', '#1f0f0d'],
  ['#56c9a0', '#091a14'],
  ['#b97fe8', '#150d1f'],
  ['#e8c45a', '#1a1600'],
];
function palette(id: string | number) {
  const idx = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  return PALETTES[idx];
}

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
export default function CoursesPage() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'videos' | 'notes'>('all');
  const router = useRouter();

  useEffect(() => {
    const cached = localStorage.getItem('cl_data');
    if (cached) {
      try { setData(JSON.parse(cached)); setLoading(false); return; } catch (_) {}
    }
    const token = localStorage.getItem('cl_token');
    if (!token) { router.push('/login'); return; }
    profileApi(token)
      .then((d) => { localStorage.setItem('cl_data', JSON.stringify(d)); setData(d); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = (data?.courses ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <div
        style={{
          minHeight: '100vh',
          background: '#0f1117',
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          color: '#e8eaf0',
        }}
      >
        {/* ── Top bar ── */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(15,17,23,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: '#fff',
              whiteSpace: 'nowrap',
              marginRight: 8,
            }}
          >
            My Courses
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 480 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
            />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#1a1d27',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                padding: '8px 16px 8px 38px',
                fontSize: 13.5,
                color: '#e8eaf0',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'recent', 'videos', 'notes'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: filter === f ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: filter === f ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: filter === f ? '#c9a84c' : '#9ca3af',
                  transition: 'all 0.15s',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* ── Grid ── */}
        <main style={{ padding: '28px 24px 60px', maxWidth: 1440, margin: '0 auto' }}>
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '28px 20px',
              }}
            >
              {filtered.map((course, i) => {
                const subjects = data?.subjects.filter((s) => s.course_id === course.course_id) ?? [];
                const units = data?.units.filter((u) =>
                  subjects.some((s) => s.subject_id === u.subject_id)
                ) ?? [];
                const videos = data?.videos.filter((v) =>
                  units.some((u) => u.unit_id === v.unit_id)
                ) ?? [];
                const notes = data?.notes.filter((n) =>
                  units.some((u) => u.unit_id === n.unit_id)
                ) ?? [];
                const [accent, bg] = palette(course.course_id);

                return (
                  <CourseCard
                    key={course.course_id}
                    course={course}
                    subjectCount={subjects.length}
                    unitCount={units.length}
                    videoCount={videos.length}
                    noteCount={notes.length}
                    accent={accent}
                    bg={bg}
                    delay={Math.min(i * 40, 240)}
                  />
           
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

/* ─────────────────────────────────────────
   Course card — YouTube thumbnail style
───────────────────────────────────────── */
function CourseCard({
  course,
  subjectCount,
  unitCount,
  videoCount,
  noteCount,
  accent,
  bg,
  delay,
}: {
  course: any;
  subjectCount: number;
  unitCount: number;
  videoCount: number;
  noteCount: number;
  accent: string;
  bg: string;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/courses/${course.course_id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        textDecoration: 'none',
        color: 'inherit',
        opacity: 0,
        animation: `fadeSlideUp 0.4s ease forwards`,
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thumbnail ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${bg} 0%, #1a1d27 100%)`,
          boxShadow: hovered
            ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accent}40`
            : '0 2px 12px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.25s, transform 0.25s',
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {course.course_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.course_image}
            alt={course.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hovered ? 0.85 : 0.7,
              transition: 'opacity 0.25s',
            }}
          />
        ) : (
          /* Decorative placeholder */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Grid pattern */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id={`grid-${course.course_id}`} width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke={accent} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${course.course_id})`} />
            </svg>

            {/* Glow blob */}
            <div
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: accent,
                opacity: 0.12,
                filter: 'blur(40px)',
              }}
            />
            <BookOpen size={36} color={accent} style={{ opacity: 0.4, position: 'relative' }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
          }}
        />

        {/* Subject badge top-right */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${accent}50`,
            color: accent,
            fontSize: 10.5,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 6,
            backdropFilter: 'blur(6px)',
            letterSpacing: '0.02em',
          }}
        >
          {subjectCount} subjects
        </span>

        {/* Unit count bottom-left (like video duration) */}
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,0.8)',
            color: '#e8eaf0',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 5,
          }}
        >
          {unitCount} units
        </span>

        {/* Play overlay on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 24px ${accent}80`,
            }}
          >
            <PlayCircle size={26} color="#000" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* ── Info row (YouTube style) ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Avatar circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}60, ${bg})`,
            border: `1px solid ${accent}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // shrink: 0,
            flexShrink: 0,
          }}
        >
          <BookOpen size={15} color={accent} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: hovered ? '#fff' : '#e2e4ed',
              lineHeight: 1.4,
              marginBottom: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              transition: 'color 0.15s',
            }}
          >
            {course.title}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <MetaBadge icon={<Video size={11} />} label={`${fmt(videoCount)} videos`} />
            <span style={{ width: 2, height: 2, borderRadius: '50%', background: '#4b5563' }} />
            <MetaBadge icon={<FileText size={11} />} label={`${fmt(noteCount)} notes`} />
          </div>

          {/* Description preview */}
          {course.description && (
            <p
              style={{
                fontSize: 11.5,
                color: '#6b7280',
                marginTop: 5,
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Progress bar (decorative) ── */}
      <div
        style={{
          height: 2,
          borderRadius: 2,
          background: '#1e2230',
          overflow: 'hidden',
          marginTop: -4,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(30 + (videoCount % 70), 90)}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
            borderRadius: 2,
          }}
        />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────
   Meta badge
───────────────────────────────────────── */
function MetaBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: '#9ca3af',
      }}
    >
      {icon}
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────
   Empty state
───────────────────────────────────────── */
function EmptyState({ search }: { search: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#1a1d27',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={28} color="rgba(138,149,168,0.4)" />
      </div>
      <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 280, lineHeight: 1.5 }}>
        {search ? `No courses match "${search}"` : 'No courses available'}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Global keyframe (inject once via <style>)
   Add this to your global CSS or a <style> tag in the layout:

   @keyframes fadeSlideUp {
     from { opacity: 0; transform: translateY(16px); }
     to   { opacity: 1; transform: translateY(0); }
   }
───────────────────────────────────────── */