'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import { ParsedData, profileApi, Unit, Video, Note } from '@/api/api';
import { ArrowLeft, Video as VideoIcon, FileText, Download, Play, Clock } from 'lucide-react';

export default function UnitPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
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
        const u = d.units.find((un: Unit) => un.unit_id === unitId);
        if (u?.videos?.[0]) setActiveVideo(u.videos[0]);
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
        const u = d.units.find((un) => un.unit_id === unitId);
        if (u?.videos?.[0]) setActiveVideo(u.videos[0]);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, unitId]);

  const unit: Unit | undefined = data?.units.find((u) => u.unit_id === unitId);
  const videos: Video[] = unit?.videos ?? [];
  const notes: Note[] = unit?.notes ?? [];

  const formatDuration = (sec?: number) => {
    if (!sec) return '';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 lg:p-10">
          <div className="shimmer rounded-2xl mb-6" style={{ height: 400, background: '#1C202E' }} />
        </div>
      </AppShell>
    );
  }

  if (!unit) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          <p className="text-slate-soft">Unit not found</p>
          <Link href={`/courses/${courseId}`} className="text-gold text-sm mt-3 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to course
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Back */}
        <Link 
          href={`/courses/${courseId}`} 
          className="inline-flex items-center gap-2 text-slate-soft hover:text-gold text-sm mb-6 transition-colors fade-up fade-up-1"
        >
          <ArrowLeft size={15} /> Back to Course
        </Link>

        {/* Header */}
        <div className="mb-8 fade-up fade-up-2">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">{unit.title}</h1>
          <div className="flex gap-4 text-xs text-slate-dim">
            <span className="flex items-center gap-1"><VideoIcon size={12} /> {videos.length} videos</span>
            <span className="flex items-center gap-1"><FileText size={12} /> {notes.length} notes</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main: Video player */}
          <div className="lg:col-span-2 fade-up fade-up-3">
            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
              {activeVideo ? (
                <>
                  {activeVideo.video_url ? (
                    <video 
                      className="video-player w-full" 
                      controls 
                      key={activeVideo.video_id}
                      poster={activeVideo.thumbnail_url}
                    >
                      <source src={activeVideo.video_url} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-black/50">
                      <p className="text-slate-soft text-sm">Video URL not available</p>
                    </div>
                  )}
                  <div className="p-5 border-t border-surface-3/40">
                    <h2 className="font-semibold text-white text-lg mb-1">{activeVideo.title}</h2>
                    {activeVideo.description && (
                      <p className="text-slate-soft text-sm mt-2">{activeVideo.description}</p>
                    )}
                    {activeVideo.duration && (
                      <p className="text-xs text-slate-dim mt-3 flex items-center gap-1">
                        <Clock size={11} /> Duration: {formatDuration(activeVideo.duration)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <p className="text-slate-soft">No video selected</p>
                </div>
              )}
            </div>

            {/* Notes section */}
            {notes.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                  <FileText size={16} color="#C9A84C" /> Notes & Materials
                </h3>
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note.note_id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors"
                      style={{ border: '1px solid rgba(42,47,58,0.4)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{note.title}</p>
                        {note.file_size && (
                          <p className="text-xs text-slate-dim mt-0.5">
                            {(note.file_size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      {note.file_path && (
                        <a
                          href={note.file_path}
                          download
                          className="ml-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gold/10 transition-colors"
                        >
                          <Download size={14} color="#C9A84C" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Video playlist */}
          <div className="fade-up fade-up-4">
            <div className="rounded-2xl p-4" style={{ background: '#1C202E', border: '1px solid rgba(42,47,58,0.5)' }}>
              <h3 className="font-semibold text-white text-sm mb-4">Video Playlist</h3>
              {videos.length === 0 ? (
                <p className="text-slate-dim text-sm">No videos available</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {videos.map((video, i) => {
                    const isActive = activeVideo?.video_id === video.video_id;
                    return (
                      <button
                        key={video.video_id}
                        onClick={() => setActiveVideo(video)}
                        className="w-full text-left rounded-xl overflow-hidden transition-all"
                        style={{
                          background: isActive ? 'rgba(201,168,76,0.1)' : 'rgba(36,40,64,0.3)',
                          border: `1px solid ${isActive ? 'rgba(201,168,76,0.3)' : 'transparent'}`,
                        }}
                      >
                        <div className="flex items-start gap-3 p-3">
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-black/30">
                            {video.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play size={12} color="rgba(201,168,76,0.5)" fill="rgba(201,168,76,0.5)" />
                              </div>
                            )}
                            <div className="absolute bottom-0.5 right-0.5 px-1 text-[9px] font-bold bg-black/80 text-white rounded">
                              {formatDuration(video.duration) || '—'}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                              >
                                {i + 1}
                              </span>
                              <p className={`text-xs flex-1 line-clamp-2 ${isActive ? 'text-gold font-medium' : 'text-white/80'}`}>
                                {video.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
