'use client';
import { useState, useMemo } from 'react';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  national_id?: string;
  device_token?: string;
  created_at: string;
  courses: Array<{ id: string; name: string; status: string }>;
}

export function StudentsDirectoryTable({ initialStudents }: { initialStudents: Student[] }) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return initialStudents;
    return initialStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.national_id?.includes(q)
    );
  }, [initialStudents, search]);

  return (
    <Card className="border border-[#e5e5e5] bg-white overflow-hidden shadow-xs">
      {/* Search Bar */}
      <div className="p-3.5 sm:p-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafafa]">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-8.5 h-9 text-xs bg-white"
          />
        </div>

        <span className="text-[11px] text-[#616161] font-medium">
          Showing {filtered.length} of {initialStudents.length} trainees
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="bg-[#fafafa] border-b border-[#e5e5e5] text-[#616161] font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Trainee Profile</th>
              <th className="px-3.5 py-3">Contact Details</th>
              <th className="px-3.5 py-3">National ID</th>
              <th className="px-3.5 py-3">Enrolled Tracks</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {filtered.map((st) => (
              <tr key={st.id} className="hover:bg-[#fafafa]/80 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#e6eff8] text-[#004e9e] border border-[#bfdbfe] flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                      {st.full_name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#222222] leading-tight">{st.full_name}</p>
                      <p className="text-[10px] text-[#9e9e9e] mt-0.5">
                        Joined {new Date(st.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3.5 py-3">
                  <p className="text-[#222222] font-mono text-[11px]">{st.email || '—'}</p>
                  <p className="text-[#9e9e9e] font-mono text-[10px] mt-0.5">{st.phone || '—'}</p>
                </td>

                <td className="px-3.5 py-3 font-mono text-[#616161] text-[11px]">
                  {st.national_id || '—'}
                </td>

                <td className="px-3.5 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {st.courses.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/courses/${c.id}`}
                        className="inline-block px-2 py-0.5 rounded-full bg-[#fafafa] hover:bg-[#e6eff8] hover:text-[#004e9e] text-[#616161] text-[10px] font-medium border border-[#e5e5e5] truncate max-w-[130px] transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                    {st.courses.length === 0 && (
                      <span className="text-[#9e9e9e] text-[10px]">No active tracks</span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudent(st)}
                    className="h-7 px-2.5 text-[11px] gap-1 font-medium"
                  >
                    <Eye className="w-3 h-3" /> Details
                  </Button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#9e9e9e] text-xs">
                  No trainees match the search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Trainee Profile Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        {selectedStudent && (
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-[#e6eff8] text-[#004e9e] border border-[#bfdbfe] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {selectedStudent.full_name.slice(0, 2)}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">{selectedStudent.full_name}</DialogTitle>
                  <DialogDescription className="text-xs">Trainee Profile &bull; Creativa Hub</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs text-[#222222]">
              <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#616161]">Email Address:</span>
                  <span className="font-mono font-medium text-[#222222]">{selectedStudent.email || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#616161]">Phone Number:</span>
                  <span className="font-mono font-medium text-[#222222]">{selectedStudent.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#616161]">Egyptian National ID:</span>
                  <span className="font-mono font-medium text-[#222222]">{selectedStudent.national_id || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#616161]">Device Pass Token:</span>
                  <Badge variant="success" className="font-mono text-[9px] px-2 py-0.5">
                    {selectedStudent.device_token ? 'Bound & Active' : 'Unbound'}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#222222] mb-1.5">Enrolled Courses ({selectedStudent.courses.length})</h4>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {selectedStudent.courses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/courses/${c.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#fafafa] hover:bg-[#e6eff8] border border-[#e5e5e5] transition-colors"
                    >
                      <span className="font-medium text-[#222222] text-xs truncate">{c.name}</span>
                      <Badge variant="outline" className="capitalize text-[10px] px-2 py-0.5">
                        {c.status}
                      </Badge>
                    </Link>
                  ))}
                  {selectedStudent.courses.length === 0 && (
                    <p className="text-xs text-[#9e9e9e]">No course enrollments found.</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full mt-2 font-bold h-9"
              onClick={() => setSelectedStudent(null)}
            >
              Close
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}