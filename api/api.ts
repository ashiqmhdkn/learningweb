"use server";
// rest of your api.ts
import crypto from 'crypto';
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  profile_image?: string;
  role?: string;
  created_at?: string;
}

export interface Video {
  video_id: string;
  title: string;
  unit_id: string;
  description?: string;
  duration?: number;
  video_url?: string;
  thumbnail_url?: string;
  status?: string;
}

export interface Note {
  note_id: string;
  unit_id: string;
  title: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  created_at?: string;
}

export interface Unit {
  unit_id: string;
  title: string;
  unit_image?: string;
  subject_id: string;
  videos?: Video[];
  notes?: Note[];
}

export interface Subject {
  subject_id: string;
  title: string;
  subject_image?: string;
  course_id: string;
  units?: Unit[];
}

export interface Course {
  course_id: string;
  title: string;
  description?: string;
  course_image?: string;
  subjects?: Subject[];
}

export interface Batch {
  batch_id: string;
  name: string;
  batch_image?: string;
  course_id: string;
  duration?: string;
  created_at?: string;
  course?: Course;
}

export interface ProfileData {
  user: User;
  batches: Record<string, BatchRaw>;
}

interface BatchRaw {
  batch_id: string;
  name: string;
  batch_image?: string;
  duration?: string;
  created_at?: string;
  course?: CourseRaw;
}

interface CourseRaw {
  course_id: string;
  title: string;
  description?: string;
  course_image?: string;
  subjects?: Record<string, SubjectRaw>;
}

interface SubjectRaw {
  subject_id: string;
  title: string;
  subject_image?: string;
  units?: Record<string, UnitRaw>;
}

interface UnitRaw {
  unit_id: string;
  title: string;
  unit_image?: string;
  videos?: VideoRaw[];
  notes?: NoteRaw[];
}

interface VideoRaw {
  video_id: string;
  title: string;
  description?: string;
  duration?: number;
  url?: string;
  video_url?: string;
  thumbnail_url?: string;
  status?: string;
}

interface NoteRaw {
  note_id: string;
  title: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  created_at?: string;
}

export interface ParsedData {
  user: User;
  batches: Batch[];
  courses: Course[];
  subjects: Subject[];
  units: Unit[];
  videos: Video[];
  notes: Note[];
}


function hashPasswordWithSalt(
  password: string,
  salt: string
): string {
  const combined = password + salt;

  return crypto
    .createHash('sha256')
    .update(combined, 'utf8')
    .digest('hex');
}
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL||'https://api.crescentlearning.org'; ;
export async function loginApi(
  email: string,
  password: string
): Promise<{ token: string;}> {
  const hashed: string = hashPasswordWithSalt(
  password,
  "y6SsdIR"
);
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({email: email,password: hashed }),
  });

  const body = await res.json().catch(() => ({}));
  console.log("loginApi response: ", body);
  if (!res.ok) {
    throw new Error(body.message || `Login failed (${res.status})`);
  }

  return {
    token: body.token ?? body.data?.token,
  };
}

export async function profileApi(
  token: string
): Promise<ParsedData> {
  const res = await fetch(`${baseUrl}/profile`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`Server error (${res.status})`);
  }

  const body = await res.json();
  console.log("profileApi response: ", body);

  const data: ProfileData = body.data ?? body;

  return parseProfileData(data);
}

function parseProfileData(data: ProfileData): ParsedData {
  const batches: Batch[] = [];
  const courses: Course[] = [];
  const subjects: Subject[] = [];
  const units: Unit[] = [];
  const videos: Video[] = [];
  const notes: Note[] = [];
  const user: User = {
    id: String(data.user?.id ?? ''),
    username: String(data.user?.username ?? ''),
    email: String(data.user?.email ?? ''),
    phone: data.user?.phone ?? undefined,
    profile_image: data.user?.profile_image ?? undefined,
    role: data.user?.role ?? undefined,
    created_at: data.user?.created_at ?? undefined,
  };

  const batchesRaw = data.batches ?? {};


  for (const [, batchRaw] of Object.entries(batchesRaw)) {
    const courseRaw = batchRaw.course;

    const batch: Batch = {
      batch_id: String(batchRaw.batch_id ?? ''),
      name: String(batchRaw.name ?? ''),
      batch_image: batchRaw.batch_image,
      course_id: String(courseRaw?.course_id ?? ''),
      duration: batchRaw.duration,
      created_at: batchRaw.created_at,
      course: courseRaw ? parseCourse(courseRaw) : undefined,
    };
    batches.push(batch);

    if (!courseRaw?.course_id) continue;

    const course = parseCourse(courseRaw);
    courses.push(course);

    const subjectsRaw = courseRaw.subjects ?? {};
    for (const [, subjectRaw] of Object.entries(subjectsRaw)) {
      if (!subjectRaw.subject_id) continue;

      const subjectUnits: Unit[] = [];
      const unitsRaw = subjectRaw.units ?? {};

      for (const [, unitRaw] of Object.entries(unitsRaw)) {
        if (!unitRaw.unit_id) continue;

        const unitVideos: Video[] = (unitRaw.videos ?? []).map((v: VideoRaw) => ({
          video_id: String(v.video_id ?? ''),
          title: String(v.title ?? ''),
          unit_id: String(unitRaw.unit_id),
          description: v.description,
          duration: Number(v.duration ?? 0),
          video_url: String(v.url ?? v.video_url ?? ''),
          thumbnail_url: v.thumbnail_url,
          status: v.status ?? 'active',
        }));

        const unitNotes: Note[] = (unitRaw.notes ?? []).map((n: NoteRaw) => ({
          note_id: String(n.note_id ?? ''),
          unit_id: String(unitRaw.unit_id),
          title: String(n.title ?? ''),
          file_path: n.file_path,
          mime_type: n.mime_type,
          file_size: n.file_size,
          created_at: n.created_at,
        }));

        const unit: Unit = {
          unit_id: String(unitRaw.unit_id),
          title: String(unitRaw.title ?? ''),
          unit_image: unitRaw.unit_image,
          subject_id: String(subjectRaw.subject_id),
          videos: unitVideos,
          notes: unitNotes,
        };

        subjectUnits.push(unit);
        units.push(unit);
        videos.push(...unitVideos);
        notes.push(...unitNotes);
      }

      const subject: Subject = {
        subject_id: String(subjectRaw.subject_id),
        title: String(subjectRaw.title ?? ''),
        subject_image: subjectRaw.subject_image,
        course_id: String(courseRaw.course_id),
        units: subjectUnits,
      };

      subjects.push(subject);
    }
  }

  return { user, batches, courses, subjects, units, videos, notes };
}

function parseCourse(courseRaw: CourseRaw): Course {
  return {
    course_id: String(courseRaw.course_id ?? ''),
    title: String(courseRaw.title ?? ''),
    description: courseRaw.description,
    course_image: courseRaw.course_image,
  };
}