'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Square, QrCode, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Session {
  id: string;
  course_id: string;
  session_number: number;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  status: 'scheduled' | 'draft' | 'active' | 'closed';
  course_status: string;
  total_registered?: number;
}

export function SessionCard({ session }: { session: Session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/start`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        router.push(`/admin/sessions/${session.id}/live`);
      } else {
        alert(json.error ?? 'Failed to start session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Close this attendance session? Students will no longer be able to check in via QR.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/close`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        router.refresh();
      } else {
        alert(json.error ?? 'Failed to close session');
      }
    } finally {
      setLoading(false);
    }
  };

  const isActive = session.status === 'active';
  const isClosed = session.status === 'closed';

  return (
    <Card
      className={`border transition-all duration-200 ${
        isActive
          ? 'border-[#a7f3d0] bg-[#ecfdf5]/40 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
          : 'border-[#e5e5e5] bg-white hover:border-[#bfdbfe] hover:shadow-[0_4px_20px_-4px_rgba(0,78,158,0.08)]'
      }`}
    >
      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border transition-all ${
              isActive
                ? 'bg-[#10b981] text-white border-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : isClosed
                ? 'bg-[#fafafa] text-[#616161] border-[#e5e5e5]'
                : 'bg-[#fafafa] text-[#9e9e9e] border-[#e5e5e5]'
            }`}
          >
            #{session.session_number}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-base text-[#222222]">
                Session {session.session_number}
              </span>
              <Badge
                variant={
                  isActive
                    ? 'success'
                    : isClosed
                    ? 'secondary'
                    : 'outline'
                }
                className="capitalize font-medium"
              >
                {isActive && (
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                  </span>
                )}
                {session.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#616161] font-mono">
              <span>{session.session_date}</span>
              {session.start_time && (
                <>
                  <span>&bull;</span>
                  <span>{session.start_time.slice(0, 5)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {(session.status === 'scheduled' || session.status === 'draft') && session.course_status !== 'finalized' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              disabled={loading}
              className="gap-1.5 font-bold shadow-md"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Start Session
            </Button>
          )}

          {isActive && (
            <>
              <Button
                variant="success"
                size="sm"
                asChild
                className="gap-1.5 font-bold shadow-lg"
              >
                <Link href={`/admin/sessions/${session.id}/live`}>
                  <QrCode className="w-3.5 h-3.5" /> Presenter Screen
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClose}
                disabled={loading}
                className="gap-1.5 font-bold shadow-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                Close
              </Button>
            </>
          )}

          {isClosed && (
            <span className="text-[11px] font-semibold text-[#616161] flex items-center gap-1.5 bg-[#fafafa] px-3.5 py-1.5 rounded-full border border-[#e5e5e5] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> Recorded &amp; Locked
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}