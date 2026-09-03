'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  ChevronRight,
  QrCode,
  Smartphone,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnrolledCourse {
  id: string;
  enrollment_id: string;
  name: string;
  description?: string;
  training_hours?: string;
  planned_sessions: number;
  min_attendance_pct: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  enrolled_at: string;
  stats: {
    total_sessions: number;
    scheduled_sessions_count: number;
    attended_sessions: number;
    missed_sessions: number;
    conducted_sessions: number;
    attendance_pct: number;
    is_eligible: boolean;
  };
}

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  national_id?: string;
}

export default function MyCoursesPage() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPass, setHasPass] = useState(false);

  const fetchCourses = useCallback(async () => {
    const token = localStorage.getItem('creativa_device_token');
    if (!token) {
      setHasPass(false);
      setLoading(false);
      return;
    }

    setHasPass(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/students/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (res.status === 401 || !json.ok) {
        if (res.status === 401) {
          setHasPass(false);
          localStorage.removeItem('creativa_device_token');
        }
        setError(json.error ?? 'Failed to load your enrolled courses.');
      } else {
        setStudent(json.data.student);
        setCourses(json.data.courses ?? []);
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const totalAttendedAcrossCourses = courses.reduce(
    (acc, c) => acc + c.stats.attended_sessions,
    0
  );

  return (
    <div className="min-h-[100dvh] subtle-mesh bg-[#fafafa] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      <div className="w-full max-w-lg mx-auto pt-2 sm:pt-4">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
          </Link>
          <div className="flex items-center gap-2">
            {hasPass && (
              <Badge variant="success" className="gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> Pass Active
              </Badge>
            )}
            <button
              onClick={() => fetchCourses()}
              disabled={loading}
              className="p-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#616161] hover:text-[#004e9e] transition-all shadow-xs"
              title="Refresh attendance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Brand Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <Card className="border border-[#e5e5e5] bg-white overflow-hidden shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <Image
                      src="/logo.png"
                      alt="Creativa Hub Logo"
                      width={36}
                      height={36}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base sm:text-lg font-bold text-[#222222] tracking-tight">
                        {student ? student.full_name : 'My Courses'}
                      </h1>
                    </div>
                    <p className="text-xs text-[#616161] mt-0.5">
                      Creativa Innovation Hub &bull; Trainee Attendance Pass
                    </p>
                  </div>
                </div>

                {student?.national_id && (
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] text-[#9e9e9e] block font-mono">National ID</span>
                    <span className="text-xs font-mono font-bold text-[#222222]">
                      {student.national_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Trainee Stats Summary Bar */}
              {courses.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-[#e5e5e5] text-center">
                  <div className="bg-[#fafafa] rounded-xl p-2 border border-[#e5e5e5]">
                    <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">
                      Enrolled Tracks
                    </span>
                    <span className="text-lg font-extrabold text-[#004e9e] font-mono leading-tight">
                      {courses.length}
                    </span>
                  </div>
                  <div className="bg-[#fafafa] rounded-xl p-2 border border-[#e5e5e5]">
                    <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">
                      Total Attended
                    </span>
                    <span className="text-lg font-extrabold text-[#047857] font-mono leading-tight">
                      {totalAttendedAcrossCourses}
                    </span>
                  </div>
                  <div className="bg-[#fafafa] rounded-xl p-2 border border-[#e5e5e5]">
                    <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">
                      Status
                    </span>
                    <span className="text-xs font-bold text-[#222222] leading-tight block mt-1">
                      Enrolled
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body Content */}
          {loading ? (
            <div className="p-12 text-center text-[#9e9e9e] text-xs flex flex-col items-center gap-2 bg-white rounded-2xl border border-[#e5e5e5]">
              <Loader2 className="w-6 h-6 animate-spin text-[#004e9e]" />
              <span>Loading your course attendance records...</span>
            </div>
          ) : !hasPass ? (
            /* No pass state */
            <Card className="border border-[#e5e5e5] bg-white p-6 sm:p-8 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#fef3e2] border border-[#fde68a] text-[#f8af43] flex items-center justify-center mx-auto mb-3.5">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#222222] mb-1">No Active Pass Found</h3>
              <p className="text-xs text-[#616161] mb-6 max-w-xs mx-auto leading-relaxed">
                Scan the session QR code in your classroom to check in, or re-link your phone if you have previously registered.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button variant="primary" asChild className="h-11 font-bold">
                  <Link href="/">
                    <QrCode className="w-4 h-4" /> Open Camera Scanner
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="h-11 font-semibold">
                  <Link href="/relink">Re-link Existing Phone</Link>
                </Button>
              </div>
            </Card>
          ) : error ? (
            /* Error state */
            <Card className="border border-[#fecaca] bg-[#fef2f2] p-6 text-center">
              <AlertCircle className="w-8 h-8 text-[#b91c1c] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#b91c1c] mb-3">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => fetchCourses()}>
                Try Again
              </Button>
            </Card>
          ) : courses.length === 0 ? (
            /* Enrolled in 0 courses */
            <Card className="border border-[#e5e5e5] bg-white p-8 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-[#9e9e9e] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#222222] mb-1">No Enrolled Courses Yet</h3>
              <p className="text-xs text-[#616161] mb-6 max-w-xs mx-auto leading-relaxed">
                You are registered with Creativa Hub, but are not currently enrolled in an active track. Scan a classroom session QR code to enroll.
              </p>
              <Button variant="primary" asChild className="w-full h-11 font-bold">
                <Link href="/">
                  <QrCode className="w-4 h-4" /> Scan Classroom QR
                </Link>
              </Button>
            </Card>
          ) : (
            /* Enrolled Courses Cards List */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#616161]">
                  Your Enrolled Courses ({courses.length})
                </span>
                <span className="text-[11px] text-[#9e9e9e]">Tap to view attendance</span>
              </div>

              {courses.map((course) => {
                const { stats } = course;
                const isGoodStanding = stats.attendance_pct >= course.min_attendance_pct;

                return (
                  <Link
                    key={course.id}
                    href={`/my-courses/${course.id}`}
                    className="block group"
                  >
                    <Card className="border border-[#e5e5e5] group-hover:border-[#bfdbfe] bg-white group-hover:shadow-[0_4px_16px_rgba(0,78,158,0.08)] transition-all overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        {/* Title & Status Badges */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  course.status === 'completed'
                                    ? 'secondary'
                                    : course.status === 'upcoming'
                                    ? 'gold'
                                    : 'blue'
                                }
                                className="text-[10px] capitalize px-2 py-0.5"
                              >
                                {course.status === 'in_progress' ? 'In Progress' : course.status}
                              </Badge>
                              {course.training_hours && (
                                <span className="text-[10px] text-[#9e9e9e] flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" /> {course.training_hours}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-[#222222] group-hover:text-[#004e9e] transition-colors leading-snug">
                              {course.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#9e9e9e] group-hover:text-[#004e9e] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="mt-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#616161]">
                              Attendance Rate
                            </span>
                            <span
                              className={`font-mono font-extrabold ${
                                isGoodStanding ? 'text-[#047857]' : 'text-[#b91c1c]'
                              }`}
                            >
                              {stats.conducted_sessions > 0
                                ? `${stats.attendance_pct}%`
                                : 'No sessions held'}
                            </span>
                          </div>

                          <div className="w-full bg-[#f0f0f0] rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isGoodStanding
                                  ? 'bg-[#10b981]'
                                  : stats.attendance_pct > 50
                                  ? 'bg-[#f8af43]'
                                  : 'bg-[#ef4444]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  stats.conducted_sessions > 0 ? stats.attendance_pct : 0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#9e9e9e] pt-0.5">
                            <span>
                              {stats.attended_sessions} attended &bull; {stats.missed_sessions} missed
                            </span>
                            <span>Min. required: {course.min_attendance_pct}%</span>
                          </div>
                        </div>

                        {/* Sessions Breakdown Pills */}
                        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-[#f0f0f0] text-center">
                          <div className="bg-[#fafafa] rounded-lg py-1.5">
                            <span className="text-[9px] font-semibold uppercase text-[#9e9e9e] block">
                              Total Sessions
                            </span>
                            <span className="text-xs font-bold text-[#222222] font-mono">
                              {stats.total_sessions}
                            </span>
                          </div>
                          <div className="bg-[#ecfdf5] rounded-lg py-1.5">
                            <span className="text-[9px] font-semibold uppercase text-[#047857] block">
                              Attended
                            </span>
                            <span className="text-xs font-bold text-[#047857] font-mono">
                              {stats.attended_sessions}
                            </span>
                          </div>
                          <div className="bg-[#fef2f2] rounded-lg py-1.5">
                            <span className="text-[9px] font-semibold uppercase text-[#b91c1c] block">
                              Missed
                            </span>
                            <span className="text-xs font-bold text-[#b91c1c] font-mono">
                              {stats.missed_sessions}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Bottom Quick Action */}
          {hasPass && courses.length > 0 && (
            <div className="pt-2">
              <Button variant="primary" asChild className="w-full h-11 font-bold shadow-xs">
                <Link href="/">
                  <QrCode className="w-4 h-4" /> Scan Next Classroom QR
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <footer className="py-4 text-center text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Creativa Innovation Hub Aswan &bull; MCIT Egypt
      </footer>
    </div>
  );
}