import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StudentsDirectoryTable } from './StudentsDirectoryTable';

export default async function AdminStudentsPage() {
  const { data: students } = await supabaseAdmin
    .from('att_students')
    .select(`
      id,
      full_name,
      email,
      phone,
      national_id,
      device_token,
      created_at,
      att_enrollments (
        id,
        course_id,
        status,
        att_courses (
          id,
          name,
          status
        )
      )
    `)
    .order('created_at', { ascending: false });

  const list = (students ?? []).map((s: any) => ({
    ...s,
    courses: (s.att_enrollments ?? []).map((e: any) => e.att_courses).filter(Boolean),
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto selection:bg-[#004e9e] selection:text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs font-semibold text-[#616161] hover:text-[#004e9e] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Overview
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
            Trainees Directory
          </h1>
          <p className="text-[#616161] text-xs mt-0.5">
            Search and view attendance records for all registered Creativa Hub trainees
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-1.5 shadow-xs">
            <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">Total Registered</span>
            <span className="text-base font-bold text-[#222222] font-mono leading-tight">{list.length}</span>
          </div>
        </div>
      </div>

      <StudentsDirectoryTable initialStudents={list} />
    </div>
  );
}