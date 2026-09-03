'use client';
import { useEffect, useState, useCallback, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  QrCode,
  RefreshCw,
  Sparkles,
  Award,
  Radio,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CourseSessionRecord {
  id: string;
  session_number: number;
  session_date: string;
  session_status: 'scheduled' | 'active' | 'closed';
  attendance_status: 'present' | 'absent' | 'active' | 'upcoming';
  checked_in_at: string | null;
  check_in_method: string | null;
  start_time: string | null;
  end_time: string | null;
}

interface CourseDetailData {
  student: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    national_id?: string;
  };
  course: {
    id: string;
    name: string;
    description?: string;
    training_hours?: string;
    planned_sessions: number;
    min_attendance_pct: number;
    status: 'upcoming' | 'in_progress' | 'completed';
    raw_status: string;
    start_date?: string;
    end_date?: string;
    month_year?: string;
    enrolled_at: string;
  };
  summary: {
    total_sessions: number;
    scheduled_sessions_count: number;
    attended_sessions: number;
    missed_sessions: number;
    conducted_sessions: number;
    attendance_pct: number;
    is_eligible: boolean;
  };
  sessions: CourseSessionRecord[];
}

export default function CourseAttendanceDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  const fetchAttendance = useCallback(async () => {
    const token = localStorage.getItem('creativa_device_token');
    if (!token) {
      router.replace('/my-courses');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('creativa_device_token');
        router.replace('/relink');
        return;
      }

      if (!json.ok) {
        setError(json.error ?? 'Failed to load course attendance history.');
      } else {
        setData(json.data);
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <div className="min-h-screen subtle-mesh bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-xs">
          <Loader2 className="w-8 h-8 text-[#004e9e] animate-spin mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#222222]">Loading Attendance...</h3>
          <p className="text-xs text-[#616161] mt-1">Retrieving your verified session history</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen subtle-mesh bg-[#fafafa] flex flex-col justify-between p-4 sm:p-6">
        <div className="w-full max-w-lg mx-auto pt-6">
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors mb-4 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Courses
          </Link>

          <Card className="border border-[#fecaca] bg-white p-6 sm:p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#222222] mb-1">Access Restricted</h3>
            <p className="text-xs text-[#616161] mb-6 max-w-xs mx-auto leading-relaxed">
              {error ?? 'You are not enrolled in this course, or this course does not exist.'}
            </p>
            <Button variant="primary" asChild className="w-full h-11 font-bold">
              <Link href="/my-courses">Return to My Courses</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const { course, summary, sessions } = data;
  const isEligible = summary.attendance_pct >= course.min_attendance_pct;

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'present') return s.attendance_status === 'present';
    if (filter === 'absent') return s.attendance_status === 'absent';
    return true;
  });

  return (
    <div className="min-h-[100dvh] subtle-mesh bg-[#fafafa] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      <div className="w-full max-w-lg mx-auto pt-2 sm:pt-4">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> My Courses
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> Verified Pass
            </Badge>
            <button
              onClick={() => fetchAttendance()}
              className="p-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#616161] hover:text-[#004e9e] transition-all shadow-xs"
              title="Refresh attendance"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Course Hero & Attendance Summary Card */}
          <Card className="border border-[#e5e5e5] bg-white overflow-hidden shadow-xs">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-[#004e9e] bg-[#e6eff8] px-2.5 py-0.5 rounded-full border border-[#bfdbfe] inline-flex items-center gap-1.5">
                      <Image
                        src="/logo.png"
                        alt="Creativa Hub"
                        width={12}
                        height={12}
                        className="object-contain"
                      />
                      Creativa Track
                    </span>
                    <Badge
                      variant={
                        course.status === 'completed'
                          ? 'secondary'
                          : course.status === 'upcoming'
                          ? 'gold'
                          : 'blue'
                      }
                      className="text-[10px] capitalize px-2.5 py-0.5"
                    >
                      {course.status === 'in_progress' ? 'In Progress' : course.status}
                    </Badge>
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#222222] tracking-tight leading-snug">
                    {course.name}
                  </h1>
                </div>

                {course.training_hours && (
                  <span className="text-xs font-mono text-[#616161] font-semibold bg-[#fafafa] px-2.5 py-1 rounded-lg border border-[#e5e5e5] shrink-0">
                    {course.training_hours}
                  </span>
                )}
              </div>

              {/* Attendance KPI Summary Grid */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3.5 border-t border-[#e5e5e5] text-center">
                <div className="bg-[#fafafa] rounded-xl p-2 border border-[#e5e5e5]">
                  <span className="text-[9px] font-semibold text-[#9e9e9e] uppercase block">
                    Sessions
                  </span>
                  <span className="text-base font-extrabold text-[#222222] font-mono leading-tight">
                    {summary.total_sessions}
                  </span>
                </div>

                <div className="bg-[#ecfdf5] rounded-xl p-2 border border-[#a7f3d0]">
                  <span className="text-[9px] font-semibold text-[#047857] uppercase block">
                    Attended
                  </span>
                  <span className="text-base font-extrabold text-[#047857] font-mono leading-tight">
                    {summary.attended_sessions}
                  </span>
                </div>

                <div className="bg-[#fef2f2] rounded-xl p-2 border border-[#fecaca]">
                  <span className="text-[9px] font-semibold text-[#b91c1c] uppercase block">
                    Missed
                  </span>
                  <span className="text-base font-extrabold text-[#b91c1c] font-mono leading-tight">
                    {summary.missed_sessions}
                  </span>
                </div>

                <div className="bg-[#e6eff8] rounded-xl p-2 border border-[#bfdbfe]">
                  <span className="text-[9px] font-semibold text-[#004e9e] uppercase block">
                    Rate
                  </span>
                  <span className="text-base font-extrabold text-[#004e9e] font-mono leading-tight">
                    {summary.conducted_sessions > 0
                      ? `${summary.attendance_pct}%`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar & Requirement Indicator */}
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#616161] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#004e9e]" />
                    Certificate Standing
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      isEligible ? 'text-[#047857]' : 'text-[#b91c1c]'
                    }`}
                  >
                    {isEligible
                      ? 'Attendance Requirement Met'
                      : 'Attendance Below Requirement'}
                  </span>
                </div>

                <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isEligible
                        ? 'bg-[#10b981]'
                        : summary.attendance_pct > 50
                        ? 'bg-[#f8af43]'
                        : 'bg-[#ef4444]'
                    }`}
                    style={{
                      width: `${Math.min(
                        summary.conducted_sessions > 0 ? summary.attendance_pct : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#9e9e9e]">
                  <span>
                    {summary.attended_sessions} of {summary.conducted_sessions} conducted sessions attended
                  </span>
                  <span>Minimum Required: {course.min_attendance_pct}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session History Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#616161]">
                  Attendance History ({sessions.length} Sessions)
                </h2>
                <p className="text-[11px] text-[#9e9e9e]">
                  Verified records from classroom QR scans
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#e5e5e5] self-start shadow-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-[#004e9e] text-white shadow-xs'
                      : 'text-[#616161] hover:text-[#222222]'
                  }`}
                >
                  All ({sessions.length})
                </button>
                <button
                  onClick={() => setFilter('present')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filter === 'present'
                      ? 'bg-[#047857] text-white shadow-xs'
                      : 'text-[#616161] hover:text-[#047857]'
                  }`}
                >
                  Present ({summary.attended_sessions})
                </button>
                <button
                  onClick={() => setFilter('absent')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filter === 'absent'
                      ? 'bg-[#b91c1c] text-white shadow-xs'
                      : 'text-[#616161] hover:text-[#b91c1c]'
                  }`}
                >
                  Absent ({summary.missed_sessions})
                </button>
              </div>
            </div>

            {/* Session Cards List */}
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filteredSessions.map((session) => {
                  const isPresent = session.attendance_status === 'present';
                  const isAbsent = session.attendance_status === 'absent';
                  const isActiveLive = session.attendance_status === 'active';

                  const dateFormatted = new Date(session.session_date).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  );

                  let checkInTime = '';
                  if (session.checked_in_at) {
                    checkInTime = new Date(session.checked_in_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });
                  }

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`border bg-white transition-all shadow-xs ${
                          isPresent
                            ? 'border-[#bfdbfe]/80 hover:border-[#bfdbfe]'
                            : isAbsent
                            ? 'border-[#fecaca]/80 hover:border-[#fecaca]'
                            : isActiveLive
                            ? 'border-[#004e9e] ring-2 ring-[#004e9e]/10'
                            : 'border-[#e5e5e5]'
                        }`}
                      >
                        <CardContent className="p-3.5 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Status Icon */}
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isPresent
                                    ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]'
                                    : isAbsent
                                    ? 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]'
                                    : isActiveLive
                                    ? 'bg-[#e6eff8] border-[#bfdbfe] text-[#004e9e]'
                                    : 'bg-[#fafafa] border-[#e5e5e5] text-[#9e9e9e]'
                                }`}
                              >
                                {isPresent ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : isAbsent ? (
                                  <XCircle className="w-5 h-5" />
                                ) : isActiveLive ? (
                                  <Radio className="w-5 h-5 animate-pulse text-[#004e9e]" />
                                ) : (
                                  <Calendar className="w-4 h-4" />
                                )}
                              </div>

                              {/* Session Info */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#222222] font-mono">
                                    Session #{session.session_number}
                                  </span>
                                  <span className="text-[11px] text-[#616161]">&bull;</span>
                                  <span className="text-xs text-[#616161] font-medium">
                                    {dateFormatted}
                                  </span>
                                </div>

                                {/* Check-in details */}
                                {isPresent && (
                                  <p className="text-[10px] text-[#047857] mt-0.5 flex items-center gap-1 font-medium">
                                    <span>Checked in at {checkInTime}</span>
                                    <span className="text-[#9e9e9e]">&bull;</span>
                                    <span className="capitalize">
                                      {session.check_in_method === 'manual'
                                        ? 'Manual Verification'
                                        : 'Room QR Scan'}
                                    </span>
                                  </p>
                                )}

                                {isAbsent && (
                                  <p className="text-[10px] text-[#b91c1c] mt-0.5 font-medium">
                                    Missed session &bull; Not recorded
                                  </p>
                                )}

                                {isActiveLive && (
                                  <p className="text-[10px] text-[#004e9e] mt-0.5 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#004e9e] animate-ping" />
                                    Session is currently live in classroom
                                  </p>
                                )}

                                {session.attendance_status === 'upcoming' && (
                                  <p className="text-[10px] text-[#9e9e9e] mt-0.5">
                                    Upcoming scheduled session
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isPresent ? (
                                <Badge
                                  variant="success"
                                  className="text-[10px] px-2.5 py-0.5 font-bold"
                                >
                                  Present
                                </Badge>
                              ) : isAbsent ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-2.5 py-0.5 font-bold"
                                >
                                  Absent
                                </Badge>
                              ) : isActiveLive ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  asChild
                                  className="h-8 px-3 text-[10px] font-bold gap-1 shadow-xs"
                                >
                                  <Link href="/">
                                    <QrCode className="w-3 h-3" /> Scan QR
                                  </Link>
                                </Button>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-2.5 py-0.5 text-[#9e9e9e]"
                                >
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredSessions.length === 0 && (
                <div className="p-8 text-center text-[#9e9e9e] text-xs bg-white rounded-2xl border border-[#e5e5e5]">
                  No sessions match the selected filter.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trainee Watermark Footer */}
      <footer className="py-5 text-center text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Trainee: {data.student.full_name} &bull; Creativa Innovation Hub
      </footer>
    </div>
  );
}
