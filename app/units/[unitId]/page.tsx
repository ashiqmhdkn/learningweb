'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/components/AppShell';
import { ParsedData, profileApi, Unit, Video, Note } from '@/api/api';
import { ArrowLeft, Video as VideoIcon, FileText, Download, Play, Clock, ClipboardList } from 'lucide-react';

export default function UnitPage() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'notes' | 'exam'>('videos');
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
      } catch (_) { }
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

        {/* Header (aligned with previous pages) */}
        <div className="mb-1">
          <div className="flex items-center gap-3">

            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-yellow-400 transition"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-white">
                {unit.title}
              </h1>
              <p className="text-gray-400 mt-1 text-sm flex gap-4">
                <span className="flex items-center gap-1">
                  <VideoIcon size={12} /> {videos.length} videos
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {notes.length} notes
                </span>
              </p>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('videos')}
            className={`pb-3 px-1 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'videos'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            <VideoIcon size={16} />
            Videos
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-1 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'notes'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            <FileText size={16} />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`pb-3 px-1 text-sm font-medium transition border-b-2 flex items-center gap-2 ${activeTab === 'exam'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              }`}
          >
            <ClipboardList size={16} />
            Exam
          </button>
        </div>

        {/* Main Layout */}
        <div className={`grid gap-6 ${activeTab === 'videos' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>

          {/* Content Area */}
          <div className={activeTab === 'videos' ? 'lg:col-span-2' : ''}>

            {activeTab === 'videos' && (
              <div className="rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 mb-6">
                {activeVideo ? (
                  <>
                    {activeVideo.video_url ? (
                      <div className="aspect-video w-full bg-black">
                        <video
                          className="w-full h-full object-contain"
                          controls
                          key={activeVideo.video_id}
                          poster={activeVideo.thumbnail_url}
                        >
                          <source src={activeVideo.video_url} type="video/mp4" />
                        </video>
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center">
                        <p className="text-gray-400 text-sm">Video unavailable</p>
                      </div>
                    )}

                    <div className="p-4 border-t border-gray-700">
                      <h2 className="font-semibold text-white text-base">
                        {activeVideo.title}
                      </h2>

                      {activeVideo.description && (
                        <p className="text-gray-400 text-sm mt-2">
                          {activeVideo.description}
                        </p>
                      )}

                      {activeVideo.duration && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <Clock size={11} /> {formatDuration(activeVideo.duration)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <p className="text-gray-400">No video selected</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === 'notes' && (
              notes.length > 0 ? (
                <div className="rounded-2xl p-5 bg-gray-800 border border-gray-700">
                  <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-yellow-400" /> Notes & Materials
                  </h3>

                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.note_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-700 hover:bg-gray-700/30 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{note.title}</p>
                          {note.file_size && (
                            <p className="text-xs text-gray-400">
                              {(note.file_size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>

                        {note.file_path && (
                          <a
                            href={note.file_path}
                            download
                            className="ml-3 p-2 rounded-lg hover:bg-yellow-400/10"
                          >
                            <Download size={14} className="text-yellow-400" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-10 bg-gray-800 border border-gray-700 flex flex-col items-center justify-center text-center">
                  <FileText size={48} className="text-gray-600 mb-4" />
                  <h3 className="font-semibold text-white text-lg mb-2">No Notes</h3>
                  <p className="text-gray-400 text-sm">There are no notes available for this unit yet.</p>
                </div>
              )
            )}

            {/* Exam */}
            {activeTab === 'exam' && (
              <div className="rounded-2xl p-10 bg-gray-800 border border-gray-700 flex flex-col items-center justify-center text-center">
                <ClipboardList size={48} className="text-gray-600 mb-4" />
                <h3 className="font-semibold text-white text-lg mb-2">Exams</h3>
                <p className="text-gray-400 text-sm">Exams for this unit will appear here.</p>
              </div>
            )}

          </div>

          {/* Playlist */}
          {activeTab === 'videos' && (
            <div>
              <div className="rounded-2xl p-4 bg-gray-800 border border-gray-700">
                <h3 className="font-semibold text-white text-sm mb-4">
                  Playlist
                </h3>

                {videos.length === 0 ? (
                  <p className="text-gray-400 text-sm">No videos available</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {videos.map((video, i) => {
                      const isActive = activeVideo?.video_id === video.video_id;

                      return (
                        <button
                          key={video.video_id}
                          onClick={() => setActiveVideo(video)}
                          className={`w-full text-left rounded-xl p-3 transition border ${isActive
                            ? 'border-yellow-400/40 bg-yellow-400/10'
                            : 'border-transparent hover:bg-gray-700/40'
                            }`}
                        >
                          <div className="flex gap-3">

                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play size={12} className="text-gray-500" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs line-clamp-2 ${isActive ? 'text-yellow-400 font-medium' : 'text-gray-300'
                                }`}>
                                {video.title}
                              </p>

                              <p className="text-[10px] text-gray-500 mt-1">
                                {formatDuration(video.duration) || '—'}
                              </p>
                            </div>

                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
