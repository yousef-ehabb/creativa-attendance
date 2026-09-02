'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function NewCoursePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minPct, setMinPct] = useState(75);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Course title is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          min_attendance_pct: Number(minPct),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        window.location.href = `/admin/courses/${json.data.id}`;
        return;
      } else {
        setError(json.error ?? 'Failed to create course cohort');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto selection:bg-[#004e9e] selection:text-white space-y-5">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      <Card className="border border-[#e5e5e5] bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] p-1.5 flex items-center justify-center shadow-xs">
              <Image src="/logo.png" alt="Creativa Hub Logo" width={28} height={28} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#222222] tracking-tight">
                Create Course Cohort
              </h1>
              <p className="text-xs text-[#616161]">Configure track title and minimum attendance criteria</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Course Name / Track Title <span className="text-[#ef4444]">*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flutter Mobile App Development - Wave 4"
                required
                className="h-10 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Description / Cohort Info <span className="text-[#9e9e9e] font-normal">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of track schedule and instructor details"
                rows={3}
                className="w-full bg-white border border-[#e5e5e5] rounded-2xl p-3 text-xs text-[#222222] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#004e9e]/20 focus:border-[#004e9e] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Minimum Attendance for Certificate (%)
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={minPct}
                  onChange={(e) => setMinPct(Number(e.target.value))}
                  required
                  className="pl-9 font-mono h-10 text-xs"
                />
              </div>
              <p className="text-[10px] text-[#9e9e9e] mt-1">
                Trainees meeting or exceeding this percentage will be eligible for certificate issuance.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-9 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1 h-9 font-bold text-xs"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Course Cohort'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}