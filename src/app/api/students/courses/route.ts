// GET /api/students/courses
// Returns all courses the authenticated student is currently enrolled in,
// along with calculated attendance summaries.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateStudent } from '@/lib/device-token';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please link your device pass.' },
        { status: 401 }
      );
    }

    // 1. Fetch all active enrollments for this authenticated student
    const { data: enrollments, error: enrError } = await supabaseAdmin
      .from('att_enrollments')
      .select(`
        id,
        course_id,
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
      .eq('status', 'active');

    if (enrError) {
      console.error('[students/courses] enrollments error:', enrError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch enrolled courses' }, { status: 500 });
    }

    const courseList = (enrollments ?? [])
      .map((e: any) => ({
        enrollment_id: e.id,
        enrolled_at: e.enrolled_at,
        course: e.att_courses,
      }))
      .filter((e) => Boolean(e.course));

    if (courseList.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          student: auth.student,
          courses: [],
        },
      });
    }

    const courseIds = courseList.map((c) => c.course.id);

    // 2. Fetch all sessions for these courses
    const { data: sessions, error: sessError } = await supabaseAdmin
      .from('att_sessions')
      .select('id, course_id, session_number, session_date, status')
      .in('course_id', courseIds)
      .order('session_number', { ascending: true });

    if (sessError) {
      console.error('[students/courses] sessions error:', sessError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // 3. Fetch attendance records strictly for THIS student
    const { data: attendance, error: attError } = await supabaseAdmin
      .from('att_attendance')
      .select('id, session_id, checked_in_at, check_in_method')
      .eq('student_id', auth.studentId);

    if (attError) {
      console.error('[students/courses] attendance error:', attError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch attendance' }, { status: 500 });
    }

    const attendedSessionIds = new Set((attendance ?? []).map((a) => a.session_id));

    // 4. Compute metrics per course
    const computedCourses = courseList.map(({ enrollment_id, enrolled_at, course }) => {
      const courseSessions = (sessions ?? []).filter((s) => s.course_id === course.id);
      const totalSessions = Math.max(courseSessions.length, course.planned_sessions || 0);
      
      const attendedSessions = courseSessions.filter((s) => attendedSessionIds.has(s.id)).length;
      const closedSessions = courseSessions.filter((s) => s.status === 'closed');
      const missedSessions = closedSessions.filter((s) => !attendedSessionIds.has(s.id)).length;
      const conductedSessions = attendedSessions + missedSessions;

      // Rate based on conducted sessions so far; if none conducted yet, default to 100%
      const attendancePct = conductedSessions > 0
        ? Math.round((attendedSessions / conductedSessions) * 100)
        : (totalSessions > 0 ? 100 : 0);

      // Course Status format: upcoming | in_progress | completed
      let displayStatus: 'upcoming' | 'in_progress' | 'completed' = 'in_progress';
      if (course.status === 'finalized') {
        displayStatus = 'completed';
      } else if (course.status === 'draft') {
        displayStatus = 'upcoming';
      } else {
        displayStatus = 'in_progress';
      }

      const minPct = course.min_attendance_pct ?? 75;
      const isEligible = attendancePct >= minPct;

      return {
        id: course.id,
        enrollment_id,
        name: course.name,
        description: course.description,
        training_hours: course.training_hours,
        planned_sessions: course.planned_sessions,
        min_attendance_pct: minPct,
        start_date: course.start_date,
        end_date: course.end_date,
        month_year: course.month_year,
        raw_status: course.status,
        status: displayStatus,
        enrolled_at,
        stats: {
          total_sessions: totalSessions,
          scheduled_sessions_count: courseSessions.length,
          attended_sessions: attendedSessions,
          missed_sessions: missedSessions,
          conducted_sessions: conductedSessions,
          attendance_pct: attendancePct,
          is_eligible: isEligible,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        student: auth.student,
        courses: computedCourses,
      },
    });
  } catch (err: any) {
    console.error('[students/courses]', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
