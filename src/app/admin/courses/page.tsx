import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Users, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const { data: courses, error: coursesError } = await supabaseAdmin
    .from('att_courses')
    .select(`
      id,
      name,
      status,
      min_attendance_pct,
      created_at,
      att_sessions (id, status, session_number),
      att_enrollments (id)
    `)
    .order('created_at', { ascending: false });

  if (coursesError) {
    console.error('[AdminCourses] Error fetching courses:', coursesError);
  }

  const list = courses ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto selection:bg-[#004e9e] selection:text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link href="/admin" className="text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors">
              &larr; Overview
            </Link>
            <span className="text-xs text-[#9e9e9e]">&bull;</span>
            <span className="text-[10px] font-bold text-[#004e9e] bg-[#e6eff8] px-2 py-0.5 rounded-full border border-[#bfdbfe] inline-flex items-center gap-1.5">
              <Image src="/logo.png" alt="Creativa Hub" width={12} height={12} className="object-contain" />
              Creativa Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
            Courses &amp; Training Tracks
          </h1>
          <p className="text-[#616161] text-xs mt-0.5">
            Manage attendance cohorts, schedule room sessions, and review final certificate eligibility.
          </p>
        </div>

        <Button variant="primary" size="sm" asChild className="h-9 px-4 text-xs font-semibold shadow-xs">
          <Link href="/admin/courses/new" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create Course Cohort
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c: any) => {
          const sessions = c.att_sessions ?? [];
          const activeSession = sessions.find((s: any) => s.status === 'active');
          const studentCount = c.att_enrollments?.length ?? 0;

          return (
            <Card
              key={c.id}
              className="border border-[#e5e5e5] bg-white hover:border-[#004e9e] hover:shadow-[0_4px_20px_-4px_rgba(0,78,158,0.08)] transition-all group flex flex-col justify-between"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <Badge
                    variant={
                      c.status === 'active'
                        ? 'success'
                        : c.status === 'finalized'
                        ? 'secondary'
                        : 'warning'
                    }
                    className="capitalize text-[10px] px-2.5 py-0.5"
                  >
                    {c.status}
                  </Badge>
                  <span className="text-[10px] text-[#616161] font-mono font-medium bg-[#fafafa] px-2 py-0.5 rounded-full border border-[#e5e5e5]">
                    Min: {c.min_attendance_pct}%
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#222222] leading-snug group-hover:text-[#004e9e] transition-colors mb-2">
                  {c.name}
                </h3>

                <div className="flex items-center gap-3.5 text-xs text-[#616161] mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#9e9e9e]" />
                    {sessions.length} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#9e9e9e]" />
                    {studentCount} trainees
                  </span>
                </div>

                {activeSession && (
                  <div className="p-2.5 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                      </span>
                      <span className="text-xs font-bold text-[#047857]">
                        Session #{activeSession.session_number} Live
                      </span>
                    </div>
                    <Link
                      href={`/admin/sessions/${activeSession.id}/live`}
                      className="text-[11px] font-bold text-[#047857] hover:underline"
                    >
                      Presenter View &rarr;
                    </Link>
                  </div>
                )}

                <div className="pt-3 border-t border-[#e5e5e5] flex items-center justify-between text-xs">
                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#222222] group-hover:text-[#004e9e] transition-colors"
                  >
                    Manage &rarr;
                  </Link>

                  <Link
                    href={`/admin/courses/${c.id}/matrix`}
                    className="font-medium text-[#616161] hover:text-[#004e9e] transition-colors"
                  >
                    Attendance Matrix
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}