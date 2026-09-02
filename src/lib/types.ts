// Shared TypeScript types for the attendance system

export interface Student {
  id: string;
  full_name: string;
  full_name_en: string;
  email: string;
  phone: string;
  national_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  training_hours?: string;
  planned_sessions: number;
  min_attendance_pct: number;
  status: 'draft' | 'active' | 'reviewing' | 'finalized';
  start_date?: string;
  end_date?: string;
  month_year?: string;
  created_at: string;
  finalized_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  status: 'active' | 'withdrawn';
}

export interface Session {
  id: string;
  course_id: string;
  session_number: number;
  session_date: string;
  status: 'scheduled' | 'active' | 'closed';
  qr_rotation_secs: number;
  started_at?: string;
  closed_at?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  enrollment_id?: string;
  checked_in_at: string;
  check_in_method: 'qr_scan' | 'manual';
  device_fingerprint?: string;
}

export interface FinalizationLog {
  id: string;
  course_id: string;
  step: 'calculate' | 'review' | 'confirm' | 'lock' | 'reopened';
  snapshot?: EligibilitySnapshot;
  performed_by?: string;
  performed_at: string;
}

export interface StudentEligibility {
  student_id: string;
  student_name: string;
  full_name_en: string;
  email: string;
  phone: string;
  national_id?: string;
  sessions_attended: number;
  total_sessions: number;
  attendance_pct: number;
  is_eligible: boolean;
  attended_dates: string[];
}

export interface EligibilitySnapshot {
  course_id: string;
  course_name: string;
  total_sessions: number;
  min_attendance_pct: number;
  required_sessions: number;
  total_students: number;
  eligible_count: number;
  not_eligible_count: number;
  missing_email_count: number;
  students: StudentEligibility[];
  calculated_at: string;
}

// API response shapes
export interface ApiSuccess<T = void> {
  ok: true;
  data?: T;
}
export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}
export type ApiResponse<T = void> = ApiSuccess<T> | ApiError;
