import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import { SessionCard } from '@/components/admin/SessionCard';
import { CourseActions } from '@/components/admin/CourseActions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch course base record
  const { data: course, error: courseError } = await supabaseAdmin
    .from('att_courses')
    .select('*')
    .eq('id', id)
    .single();

  if (courseError || !course) {
    console.error('Course lookup failed:', courseError);
    notFound();
  }

  // 2. Fetch sessions for this course
  const { data: sessionsData, error: sessionsError } = await supabaseAdmin
    .from('att_sessions')
    .select('*')
    .eq('course_id', id)
    .order('session_number', { ascending: true });

  if (sessionsError) {
    console.error('Sessions lookup error:', sessionsError);
  }

  // 3. Fetch enrollments count for this course
  const { data: enrollmentsData, error: enrollmentsError } = await supabaseAdmin
    .from('att_enrollments')
    .select('id, student_id, status')
    .eq('course_id', id);

  if (enrollmentsError) {
    console.error('Enrollments lookup error:', enrollmentsError);
  }

  const sessions = sessionsData ?? [];
  const enrollments = enrollmentsData ?? [];
  const activeSession = sessions.find((s: any) => s.status === 'active');
  const closedSessions = sessions.filter((s: any) => s.status === 'closed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto selection:bg-[#004e9e] selection:text-white space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors mb-2.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses Directory
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={
                  course.status === 'active'
                    ? 'success'
                    : course.status === 'finalized'
                    ? 'secondary'
                    : 'warning'
                }
                className="capitalize text-[10px] px-2.5 py-0.5"
              >
                {course.status}
              </Badge>
              <span className="text-xs text-[#9e9e9e]">&bull;</span>
              <span className="text-xs text-[#616161] font-mono font-medium">
                Min. Attendance: {course.min_attendance_pct}%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
              {course.name}
            </h1>
            {course.description && (
              <p className="text-xs text-[#616161] mt-1 max-w-2xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Action buttons component */}
          <CourseActions
            courseId={course.id}
            status={course.status}
            activeSessionId={activeSession?.id}
          />
        </div>
      </div>

      {/* Course Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-[#e5e5e5] bg-white">
          <CardContent className="p-3.5 sm:p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#616161] block">Total Sessions</span>
            <span className="text-xl font-bold text-[#222222] font-mono mt-0.5 block">
              {sessions.length}
            </span>
            <span className="text-[10px] text-[#616161] mt-0.5 block font-normal">{closedSessions.length} closed</span>
          </CardContent>
        </Card>

        <Card className="border border-[#e5e5e5] bg-white">
          <CardContent className="p-3.5 sm:p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#616161] block">Enrolled Trainees</span>
            <span className="text-xl font-bold text-[#222222] font-mono mt-0.5 block">
              {enrollments.length}
            </span>
            <span className="text-[10px] text-[#616161] mt-0.5 block font-normal">Active attendees</span>
          </CardContent>
        </Card>

        <Card className="border border-[#e5e5e5] bg-white">
          <CardContent className="p-3.5 sm:p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#616161] block">Active Session</span>
            <span className="text-xl font-bold text-[#222222] font-mono mt-0.5 block">
              {activeSession ? `#${activeSession.session_number}` : 'None'}
            </span>
            <span className="text-[10px] text-[#047857] font-semibold mt-0.5 block">
              {activeSession ? 'Broadcasting live QR' : 'Idle'}
            </span>
          </CardContent>
        </Card>

        <Card className="border border-[#e5e5e5] bg-white">
          <CardContent className="p-3.5 sm:p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#616161] block">Roster Status</span>
            <span className="text-xl font-bold text-[#222222] font-mono mt-0.5 block capitalize">
              {course.status}
            </span>
            <span className="text-[10px] text-[#616161] mt-0.5 block font-normal">
              {course.status === 'finalized' ? 'Locked for export' : 'Open for check-in'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#222222] tracking-tight">
              Course Sessions ({sessions.length})
            </h2>
            <p className="text-xs text-[#616161] mt-0.5">
              Launch rotating QR codes for live classroom check-ins
            </p>
          </div>

          {course.status !== 'finalized' && (
            <Button variant="primary" size="sm" asChild className="h-8 px-3 text-xs font-semibold">
              <Link href={`/admin/courses/${id}/sessions/new`} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Session
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-2.5">
          {sessions.map((s: any) => (
            <SessionCard
              key={s.id}
              session={{
                ...s,
                course_id: id,
                course_status: course.status,
                total_registered: enrollments.length,
              }}
            />
          ))}

          {sessions.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#e5e5e5]">
              <Calendar className="w-7 h-7 text-[#9e9e9e] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#222222] mb-1">No Sessions Scheduled</h3>
              <p className="text-xs text-[#616161] mb-3.5 max-w-sm mx-auto">
                Schedule your first session date to start generating QR attendance codes.
              </p>
              <Button variant="primary" size="sm" asChild className="font-semibold">
                <Link href={`/admin/courses/${id}/sessions/new`}>
                  <Plus className="w-3.5 h-3.5" /> Add First Session
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}