'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function NewSessionPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate) {
      setError('Date is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          session_date: sessionDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        window.location.href = `/admin/courses/${courseId}`;
        return;
      } else {
        setError(json.error ?? 'Failed to schedule session');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto selection:bg-[#004e9e] selection:text-white space-y-5">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
      </Link>

      <Card className="border border-[#e5e5e5] bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] p-1.5 flex items-center justify-center shadow-xs">
              <Image src="/logo.png" alt="Creativa Hub Logo" width={28} height={28} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#222222] tracking-tight">
                Schedule Room Session
              </h1>
              <p className="text-xs text-[#616161]">Set the date and timeframe for this attendance session</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#222222] mb-1.5">
                Session Date <span className="text-[#ef4444]">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#222222] mb-1.5">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-9 font-mono h-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222222] mb-1.5">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-[#9e9e9e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-9 font-mono h-10 text-xs"
                  />
                </div>
              </div>
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
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Schedule Session'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}