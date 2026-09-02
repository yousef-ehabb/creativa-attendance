'use client';
import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Props {
  courseId: string;
  courseStatus: string;
  minPct: number;
  sessions: Array<{ id: string; session_number: number; session_date: string; status: string }>;
  students: Array<{ id: string; full_name: string; email: string; phone: string }>;
  initialAttendance: Array<{ id: string; session_id: string; student_id: string; check_in_method: string }>;
}

export function AttendanceMatrixTable({
  courseStatus,
  minPct,
  sessions,
  students,
  initialAttendance,
}: Props) {
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState(initialAttendance);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);

  // Set of "sessionId:studentId"
  const attendedMap = useMemo(() => {
    const map = new Set<string>();
    attendance.forEach((a) => map.add(`${a.session_id}:${a.student_id}`));
    return map;
  }, [attendance]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [students, search]);

  const toggleAttendance = async (sessionId: string, studentId: string) => {
    if (courseStatus === 'finalized') {
      alert('This course is finalized and locked.');
      return;
    }
    const key = `${sessionId}:${studentId}`;
    const isAttended = attendedMap.has(key);
    setLoadingCell(key);

    try {
      if (isAttended) {
        const res = await fetch(`/api/sessions/${sessionId}/manual`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId }),
        });
        const json = await res.json();
        if (json.ok) {
          setAttendance((prev) =>
            prev.filter((a) => !(a.session_id === sessionId && a.student_id === studentId))
          );
        }
      } else {
        const res = await fetch(`/api/sessions/${sessionId}/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId }),
        });
        const json = await res.json();
        if (json.ok) {
          setAttendance((prev) => [
            ...prev,
            { id: String(Date.now()), session_id: sessionId, student_id: studentId, check_in_method: 'manual' },
          ]);
        }
      }
    } finally {
      setLoadingCell(null);
    }
  };

  const totalSessions = sessions.length;

  return (
    <Card className="border border-[#e5e5e5] bg-white overflow-hidden shadow-xs">
      {/* Search Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa]">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name, email..."
            className="pl-8.5 h-9 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#616161]">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="text-[11px] text-[#616161] font-medium">
            Click any cell to toggle status
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#fafafa] border-b border-[#e5e5e5] text-[#616161] font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5 min-w-[200px] sticky left-0 bg-[#fafafa] z-20">
                Trainee Profile
              </th>
              {sessions.map((s) => (
                <th key={s.id} className="px-2 py-2.5 text-center min-w-[70px]">
                  <div className="font-bold text-[#222222]">S#{s.session_number}</div>
                  <div className="text-[9px] text-[#9e9e9e] font-mono font-normal">
                    {s.session_date.slice(5)}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2.5 text-center min-w-[75px]">Attended</th>
              <th className="px-3 py-2.5 text-center min-w-[75px]">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {filteredStudents.map((st) => {
              let attendedCount = 0;
              sessions.forEach((s) => {
                if (attendedMap.has(`${s.id}:${st.id}`)) attendedCount++;
              });
              const pct = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;
              const isEligible = pct >= minPct;

              return (
                <tr key={st.id} className="hover:bg-[#fafafa]/80 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white hover:bg-[#fafafa]/80 z-10">
                    <p className="font-bold text-xs text-[#222222] leading-tight">{st.full_name}</p>
                    <p className="text-[10px] text-[#9e9e9e] mt-0.5 font-mono">{st.email || st.phone || '—'}</p>
                  </td>

                  {sessions.map((s) => {
                    const key = `${s.id}:${st.id}`;
                    const hasAttended = attendedMap.has(key);
                    const isLoading = loadingCell === key;

                    return (
                      <td key={s.id} className="px-1.5 py-2 text-center">
                        <button
                          onClick={() => toggleAttendance(s.id, st.id)}
                          disabled={isLoading || courseStatus === 'finalized'}
                          title={`Click to toggle for ${st.full_name} on session #${s.session_number}`}
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                            hasAttended
                              ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-[#d1fae5]'
                              : 'bg-[#fafafa] text-[#9e9e9e] border border-[#e5e5e5] hover:bg-[#f4f4f5] hover:text-[#616161]'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#616161]" />
                          ) : hasAttended ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[11px] font-semibold">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-[#222222]">
                    {attendedCount} / {totalSessions}
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono">
                    <Badge variant={isEligible ? 'success' : 'secondary'} className="font-mono text-[10px] px-2 py-0.5">
                      {pct.toFixed(0)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}

            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={sessions.length + 3} className="px-5 py-12 text-center text-[#9e9e9e] text-xs">
                  {students.length === 0 ? 'No students enrolled in this course yet.' : 'No matching trainees found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}