// GET /api/students/courses/[courseId]
// Returns complete per-session attendance history for the authenticated student in a specific course.
// Scoped strictly to the authenticated student - rejects unauthorized access.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateStudent } from '@/lib/device-token';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const auth = await authenticateStudent(req);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please link your device pass.' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ ok: false, error: 'Course ID is required' }, { status: 400 });
    }

    // 1. Verify that THIS student is actually enrolled in this course
    const { data: enrollment, error: enrError } = await supabaseAdmin
      .from('att_enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        att_courses (
          id,
          name,
          description,
          training_hours,
          planned_sessions,
          min_attendance_pct,
          status,
          start_date,
          end_date,
          month_year
        )
      `)
      .eq('student_id', auth.studentId)
      .eq('course_id', courseId)
      .single();

    if (enrError || !enrollment || !enrollment.att_courses) {
      return NextResponse.json(
        { ok: false, error: 'Course not found or you are not enrolled in this course.' },
        { status: 404 }
      );
    }

    const course: any = enrollment.att_courses;

    // 2. Fetch all sessions for this course
    const { data: sessions, error: sessError } = await supabaseAdmin
      .from('att_sessions')
      .select('id, session_number, session_date, status, started_at, closed_at, start_time, end_time')
      .eq('course_id', courseId)
      .order('session_number', { ascending: true });

    if (sessError) {
      console.error('[students/courses/[id]] sessions error:', sessError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch course sessions' }, { status: 500 });
    }

    const sessionList = sessions ?? [];
    const sessionIds = sessionList.map((s) => s.id);

    // 3. Fetch attendance records strictly for THIS student
    let attendanceMap = new Map<string, any>();
    if (sessionIds.length > 0) {
      const { data: attList, error: attError } = await supabaseAdmin
        .from('att_attendance')
        .select('id, session_id, checked_in_at, check_in_method')
        .eq('student_id', auth.studentId)
        .in('session_id', sessionIds);

      if (attError) {
        console.error('[students/courses/[id]] attendance error:', attError);
        return NextResponse.json({ ok: false, error: 'Failed to fetch attendance' }, { status: 500 });
      }

      (attList ?? []).forEach((a) => {
        attendanceMap.set(a.session_id, a);
      });
    }

    // 4. Map each session with attendance status
    const sessionHistory = sessionList.map((s) => {
      const att = attendanceMap.get(s.id);
      let attendanceStatus: 'present' | 'absent' | 'active' | 'upcoming';

      if (att) {
        attendanceStatus = 'present';
      } else if (s.status === 'closed') {
        attendanceStatus = 'absent';
      } else if (s.status === 'active') {
        attendanceStatus = 'active'; // Currently live in class
      } else {
        attendanceStatus = 'upcoming';
      }

      return {
        id: s.id,
        session_number: s.session_number,
        session_date: s.session_date,
        session_status: s.status,
        attendance_status: attendanceStatus,
        checked_in_at: att?.checked_in_at ?? null,
        check_in_method: att?.check_in_method ?? null,
        start_time: s.start_time ?? null,
        end_time: s.end_time ?? null,
      };
    });

    // 5. Calculate summary metrics
    const totalSessions = Math.max(sessionList.length, course.planned_sessions || 0);
    const attendedCount = sessionHistory.filter((s) => s.attendance_status === 'present').length;
    const closedCount = sessionList.filter((s) => s.status === 'closed').length;
    const missedCount = sessionHistory.filter((s) => s.attendance_status === 'absent').length;
    const conductedCount = attendedCount + missedCount;

    const attendancePct = conductedCount > 0
      ? Math.round((attendedCount / conductedCount) * 100)
      : (totalSessions > 0 ? 100 : 0);

    const minPct = course.min_attendance_pct ?? 75;
    const isEligible = attendancePct >= minPct;

    let displayStatus: 'upcoming' | 'in_progress' | 'completed' = 'in_progress';
    if (course.status === 'finalized') {
      displayStatus = 'completed';
    } else if (course.status === 'draft') {
      displayStatus = 'upcoming';
    }

    return NextResponse.json({
      ok: true,
      data: {
        student: auth.student,
        course: {
          id: course.id,
          name: course.name,
          description: course.description,
          training_hours: course.training_hours,
          planned_sessions: course.planned_sessions,
          min_attendance_pct: minPct,
          start_date: course.start_date,
          end_date: course.end_date,
          month_year: course.month_year,
          status: displayStatus,
          raw_status: course.status,
          enrolled_at: enrollment.enrolled_at,
        },
        summary: {
          total_sessions: totalSessions,
          scheduled_sessions_count: sessionList.length,
          attended_sessions: attendedCount,
          missed_sessions: missedCount,
          conducted_sessions: conductedCount,
          attendance_pct: attendancePct,
          is_eligible: isEligible,
        },
        sessions: sessionHistory,
      },
    });
  } catch (err: any) {
    console.error('[students/courses/[id]]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
