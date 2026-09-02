import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { AttendanceMatrixTable } from './AttendanceMatrixTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AttendanceMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: course } = await supabaseAdmin
    .from('att_courses')
    .select('*')
    .eq('id', id)
    .single();

  if (!course) notFound();

  // Fetch all sessions for this course
  const { data: sessions } = await supabaseAdmin
    .from('att_sessions')
    .select('id, session_number, session_date, status')
    .eq('course_id', id)
    .order('session_number');

  // Fetch all enrollments with student data
  const { data: enrollments } = await supabaseAdmin
    .from('att_enrollments')
    .select(`
      id,
      student_id,
      att_students (
        id,
        full_name,
        email,
        phone,
        national_id
      )
    `)
    .eq('course_id', id)
    .eq('status', 'active');

  // Fetch all attendance records for this course's sessions
  const sessionIds = (sessions ?? []).map((s) => s.id);
  let attendanceRecords: any[] = [];
  if (sessionIds.length > 0) {
    const { data: att } = await supabaseAdmin
      .from('att_attendance')
      .select('id, session_id, student_id, check_in_method, checked_in_at')
      .in('session_id', sessionIds);
    attendanceRecords = att ?? [];
  }

  const studentsList = (enrollments ?? [])
    .map((e: any) => e.att_students)
    .filter(Boolean)
    .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto selection:bg-[#004e9e] selection:text-white space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href={`/admin/courses/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Course Overview
            </Link>
            <span className="text-xs text-[#9e9e9e]">&bull;</span>
            <span className="text-[10px] font-bold text-[#004e9e] bg-[#e6eff8] px-2 py-0.5 rounded-full border border-[#bfdbfe] inline-flex items-center gap-1.5">
              <Image src="/logo.png" alt="Creativa Hub" width={12} height={12} className="object-contain" />
              Creativa Hub
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
              Attendance Matrix
            </h1>
            <Badge variant="blue" className="text-[10px] px-2.5 py-0.5">{course.name}</Badge>
          </div>
          <p className="text-[#616161] text-xs mt-0.5">
            2D Sessions × Students attendance grid. Click any cell to manually toggle attendance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="h-9 px-3.5 text-xs font-semibold">
            <a href={`/api/courses/${id}/export?format=master`} className="gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#004e9e]" /> Export Master Sheet (.XLSX)
            </a>
          </Button>
        </div>
      </div>

      <AttendanceMatrixTable
        courseId={id}
        courseStatus={course.status}
        minPct={course.min_attendance_pct}
        sessions={sessions ?? []}
        students={studentsList}
        initialAttendance={attendanceRecords}
      />
    </div>
  );
}