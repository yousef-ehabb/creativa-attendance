import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';
import { calculateEligibility } from '@/lib/eligibility';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'master'; // 'master' | 'detailed' | 'matrix' | 'eligibility' | 'raw'

  const { data: course } = await supabaseAdmin.from('att_courses').select('*').eq('id', id).single();
  if (!course) return NextResponse.json({ ok: false, error: 'Course not found' }, { status: 404 });

  // 1. Fetch all sessions
  const { data: sessions } = await supabaseAdmin
    .from('att_sessions')
    .select('id, session_number, session_date, start_time, status')
    .eq('course_id', id)
    .order('session_number');

  const sessionList = sessions ?? [];
  const sessionIds = sessionList.map((s) => s.id);

  // 2. Fetch all enrollments with student data
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

  // 3. Fetch all attendance records with timestamps
  let attendanceRecords: any[] = [];
  if (sessionIds.length > 0) {
    const { data: att } = await supabaseAdmin
      .from('att_attendance')
      .select('id, session_id, student_id, check_in_method, checked_in_at')
      .in('session_id', sessionIds)
      .order('checked_in_at');
    attendanceRecords = att ?? [];
  }

  // Map session ID to session details
  const sessionMap = new Map(sessionList.map((s) => [s.id, s]));

  // Map student ID to student details
  const studentsMap = new Map<string, any>();
  (enrollments ?? []).forEach((e: any) => {
    if (e.att_students) {
      studentsMap.set(e.student_id, e.att_students);
    }
  });

  // Map "sessionId:studentId" -> attendance record
  const checkinMap = new Map<string, any>();
  attendanceRecords.forEach((a) => {
    checkinMap.set(`${a.session_id}:${a.student_id}`, a);
  });

  const snapshot = await calculateEligibility(id);
  const totalSessions = sessionList.length;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Detailed Session Log (Every check-in event with timestamp)
  // -------------------------------------------------------------
  const detailedLogRows = attendanceRecords.map((a) => {
    const s = sessionMap.get(a.session_id);
    const st = studentsMap.get(a.student_id);
    const checkedAt = new Date(a.checked_in_at);
    return {
      'Course Name': course.name,
      'Session #': s ? `Session ${s.session_number}` : 'Unknown',
      'Session Date': s ? s.session_date : '—',
      'Student Full Name': st ? st.full_name : 'Unknown',
      'Email Address': st ? st.email : '—',
      'Phone Number': st ? st.phone : '—',
      'National ID': st ? (st.national_id || '—') : '—',
      'Checked-in Timestamp': checkedAt.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      'Check-in Method': a.check_in_method === 'manual' ? 'Coordinator Override' : 'QR Scan (Camera)',
    };
  });

  // -------------------------------------------------------------
  // Sheet 2: Master Attendance Matrix (Student Info + Every Session Date + Timestamps)
  // -------------------------------------------------------------
  const matrixRows: Record<string, any>[] = [];
  const sortedStudents = Array.from(studentsMap.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  sortedStudents.forEach((st) => {
    let attendedCount = 0;
    const row: Record<string, any> = {
      'Student Full Name': st.full_name,
      'Email Address': st.email || '—',
      'Phone Number': st.phone || '—',
      'National ID': st.national_id || '—',
    };

    // Columns for every session with session date
    sessionList.forEach((s) => {
      const colName = `S#${s.session_number} (${s.session_date})`;
      const rec = checkinMap.get(`${s.id}:${st.id}`);
      if (rec) {
        attendedCount++;
        const t = new Date(rec.checked_in_at);
        const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        row[colName] = `Present (${timeStr})`;
      } else {
        row[colName] = 'Absent';
      }
    });

    const pct = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;
    const isEligible = pct >= course.min_attendance_pct;

    row['Attended Sessions'] = `${attendedCount} / ${totalSessions}`;
    row['Attendance Rate'] = `${pct.toFixed(1)}%`;
    row['Eligibility Status'] = isEligible ? 'Eligible' : 'Not Eligible';

    matrixRows.push(row);
  });

  // -------------------------------------------------------------
  // Sheet 3: Certificate Eligible Roster
  // -------------------------------------------------------------
  const eligibleRows = snapshot.students
    .filter((s) => s.is_eligible)
    .map((s) => ({
      'Full Name': s.student_name,
      'Email': s.email,
      'Phone': s.phone,
      'National ID': s.national_id ?? '',
      'Attended Sessions': s.sessions_attended,
      'Total Sessions': s.total_sessions,
      'Attendance Rate': `${s.attendance_pct.toFixed(1)}%`,
      'Status': 'Eligible for Certificate',
    }));

  if (format === 'detailed') {
    // Single sheet: Detailed Log
    const ws = XLSX.utils.json_to_sheet(detailedLogRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Detailed Check-in Log');
  } else if (format === 'eligibility') {
    // Single sheet: Eligible roster
    const ws = XLSX.utils.json_to_sheet(eligibleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Eligible Students');
  } else if (format === 'raw') {
    // Raw log compatible with previous scripts
    const ws = XLSX.utils.json_to_sheet(detailedLogRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Raw Log');
  } else {
    // Default: 'master' comprehensive multi-tab workbook!
    const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
    const wsDetailed = XLSX.utils.json_to_sheet(detailedLogRows);
    const wsEligible = XLSX.utils.json_to_sheet(eligibleRows);

    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Attendance Matrix & Dates');
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Checkin Timestamps');
    XLSX.utils.book_append_sheet(wb, wsEligible, 'Certificate Eligible Roster');
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const courseName = course.name.replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const filename = `${courseName}_${format === 'master' ? 'Master_Attendance_Sheet' : format}_attendance.xlsx`;

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}