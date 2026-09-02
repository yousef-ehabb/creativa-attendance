// Attendance eligibility calculation - mirrors the logic in the certificate system
import type { StudentEligibility, EligibilitySnapshot } from './types';
import { supabaseAdmin } from './supabase-admin';

export async function calculateEligibility(courseId: string): Promise<EligibilitySnapshot> {
  // Load course
  const { data: course, error: ce } = await supabaseAdmin
    .from('att_courses').select('*').eq('id', courseId).single();
  if (ce || !course) throw new Error('Course not found');

  // Load all closed sessions for this course
  const { data: sessions } = await supabaseAdmin
    .from('att_sessions')
    .select('id, session_date, status')
    .eq('course_id', courseId)
    .eq('status', 'closed')
    .order('session_date');
  const closedSessions = sessions ?? [];
  const sessionIds = closedSessions.map((s: any) => s.id);
  const totalSessions = closedSessions.length;
  const requiredSessions = Math.ceil(totalSessions * course.min_attendance_pct / 100);

  // Load all enrollments with student data
  const { data: enrollments } = await supabaseAdmin
    .from('att_enrollments')
    .select('id, student_id, status, att_students(id, full_name, full_name_en, email, phone, national_id)')
    .eq('course_id', courseId)
    .eq('status', 'active');

  // Load all attendance for this course's sessions
  const { data: attendanceRows } = sessionIds.length > 0
    ? await supabaseAdmin
        .from('att_attendance')
        .select('session_id, student_id, checked_in_at')
        .in('session_id', sessionIds)
    : { data: [] };

  // Build attendance map: student_id -> Set<session_id>
  const attendanceMap = new Map<string, Set<string>>();
  for (const row of (attendanceRows ?? [])) {
    if (!attendanceMap.has(row.student_id)) {
      attendanceMap.set(row.student_id, new Set());
    }
    attendanceMap.get(row.student_id)!.add(row.session_id);
  }

  // Build session date map: session_id -> date
  const sessionDateMap = new Map<string, string>();
  for (const s of closedSessions) sessionDateMap.set((s as any).id, (s as any).session_date);

  // Calculate eligibility for each enrolled student
  const students: StudentEligibility[] = [];
  for (const enrollment of (enrollments ?? [])) {
    const student = (enrollment as any).att_students;
    if (!student) continue;
    const attended = attendanceMap.get(student.id) ?? new Set();
    const attendedDates = [...attended]
      .map(sid => sessionDateMap.get(sid) ?? '')
      .filter(Boolean)
      .sort();
    const attendedCount = attended.size;
    const pct = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;
    students.push({
      student_id: student.id,
      student_name: student.full_name,
      full_name_en: student.full_name_en,
      email: student.email,
      phone: student.phone,
      national_id: student.national_id,
      sessions_attended: attendedCount,
      total_sessions: totalSessions,
      attendance_pct: Math.round(pct * 100) / 100,
      is_eligible: attendedCount >= requiredSessions,
      attended_dates: attendedDates,
    });
  }

  students.sort((a, b) => {
    if (a.is_eligible !== b.is_eligible) return a.is_eligible ? -1 : 1;
    return b.attendance_pct - a.attendance_pct;
  });

  return {
    course_id: courseId,
    course_name: course.name,
    total_sessions: totalSessions,
    min_attendance_pct: course.min_attendance_pct,
    required_sessions: requiredSessions,
    total_students: students.length,
    eligible_count: students.filter(s => s.is_eligible).length,
    not_eligible_count: students.filter(s => !s.is_eligible).length,
    missing_email_count: students.filter(s => !s.email).length,
    students,
    calculated_at: new Date().toISOString(),
  };
}
