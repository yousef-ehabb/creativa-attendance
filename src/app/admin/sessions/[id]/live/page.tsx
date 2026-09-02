'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { ArrowLeft, Users, ShieldCheck, Square, Loader2, CheckCircle2, RefreshCw, QrCode, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Attendee {
  id: string;
  student_id: string;
  student_name: string;
  checked_in_at: string;
  method: string;
}

export default function LiveSessionPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [ttl, setTtl] = useState(30);
  const [session, setSession] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [closing, setClosing] = useState(false);

  const fetchQr = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/qr`);
      const json = await res.json();
      if (json.ok) {
        setQrDataUrl(json.data.qr_data_url);
        setTtl(json.data.ttl_seconds ?? 30);
      }
    } catch (e) {
      console.error('QR fetch error', e);
    }
  };

  // Fetch attendees from server-side API (uses supabaseAdmin, bypasses RLS)
  const fetchAttendees = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`);
      const json = await res.json();
      if (json.ok) {
        setSession(json.data.session);
        setAttendees(json.data.attendees ?? []);
      }
    } catch (e) {
      console.error('Attendance fetch error', e);
    }
  }, [sessionId]);

  // Initial data load + QR rotation timer
  useEffect(() => {
    fetchAttendees();
    fetchQr();

    const qrInterval = setInterval(fetchQr, 28000);
    const secInterval = setInterval(() => {
      setTtl((t) => (t > 1 ? t - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(secInterval);
    };
  }, [sessionId, fetchAttendees]);

  // Supabase Realtime subscription — refetch from server API on new attendance
  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'att_attendance',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch full attendee list from server (includes student names)
          // This avoids querying att_students directly from the browser client
          fetchAttendees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchAttendees]);

  const handleClose = async () => {
    if (!confirm('Close this attendance session? The QR code will be deactivated.')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        router.push(`/admin/courses/${session?.course_id}`);
      } else {
        alert(json.error ?? 'Failed to close session');
      }
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] subtle-mesh bg-[#fafafa] text-[#222222] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      {/* Top Header matching Creativa Hub layout */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <Link
            href={session ? `/admin/courses/${session.course_id}` : '/admin'}
            className="p-2 rounded-full bg-white border border-[#e5e5e5] text-[#616161] hover:text-[#004e9e] hover:border-[#bfdbfe] transition-all shadow-xs"
            title="Back to Course"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-[#e5e5e5] overflow-hidden shrink-0 shadow-xs">
            <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#222222] tracking-tight">
                {(session?.att_courses as any)?.name ?? 'Live Classroom Session'}
              </h1>
              <Badge variant="blue" className="text-[10px] px-2.5 py-0.5 font-mono">
                Session #{session?.session_number}
              </Badge>
            </div>
            <p className="text-xs text-[#616161] mt-0.5 font-medium">
              Creativa Innovation Hub Aswan &bull; Live Presenter Screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-xs font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
            </span>
            <span>Broadcasting Live</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleClose}
            disabled={closing}
            className="gap-1.5 font-bold h-9 px-4 shadow-xs"
          >
            {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
            Close Session
          </Button>
        </div>
      </header>

      {/* Main Grid: Clean Paper Cards matching the Creativa Design System */}
      <main className="max-w-6xl w-full mx-auto my-auto py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: QR Code Display Card */}
        <div className="lg:col-span-7 flex flex-col items-center text-center">
          <div className="relative p-6 sm:p-8 bg-white rounded-3xl border border-[#e5e5e5] shadow-[0_12px_36px_-8px_rgba(0,78,158,0.08)] max-w-sm sm:max-w-md w-full">
            {/* Subtle Brand Halo */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-b from-[#004e9e]/8 via-[#f8af43]/5 to-transparent blur-2xl -z-10 pointer-events-none" />

            <div className="aspect-square w-full relative flex items-center justify-center bg-[#fafafa] rounded-2xl border border-[#e5e5e5] p-3">
              {qrDataUrl ? (
                <motion.div
                  key={qrDataUrl}
                  initial={{ opacity: 0.85, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img
                    src={qrDataUrl}
                    alt="Live Attendance QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#616161]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#004e9e] mb-2" />
                  <span className="text-xs font-semibold text-[#222222]">Generating QR Code...</span>
                </div>
              )}
            </div>

            {/* Security Bar with Rotation Timer */}
            <div className="mt-5 pt-4 border-t border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#222222]">
                <ShieldCheck className="w-4 h-4 text-[#047857]" />
                <span>HMAC-256 Anti-Proxy</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#004e9e] bg-[#e6eff8] px-3 py-1 rounded-full border border-[#bfdbfe]">
                <RefreshCw className="w-3 h-3 animate-spin text-[#004e9e]" />
                <span>Rotates in {ttl}s</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#616161] mt-3.5 max-w-sm leading-relaxed font-medium">
            Open camera or trainee scanner &bull; Scan the QR code to record attendance
          </p>
        </div>

        {/* Right Column: Attendees Count & Stream */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Live Attendees Counter Card */}
          <Card className="border border-[#e5e5e5] bg-white shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#616161]">Live Attendees</span>
                <div className="w-7 h-7 rounded-full bg-[#fef3e2] border border-[#fde68a] flex items-center justify-center text-[#f8af43]">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#222222] font-mono tracking-tight">
                  {attendees.length}
                </span>
                <span className="text-xs text-[#616161] font-medium">trainees recorded</span>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Check-in Feed */}
          <Card className="border border-[#e5e5e5] bg-white shadow-xs flex flex-col h-[340px]">
            <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#f8af43]" />
                <span className="text-xs font-bold text-[#222222]">Live Check-in Stream</span>
              </div>
              <span className="text-[10px] text-[#616161] font-mono bg-[#fafafa] px-2.5 py-0.5 rounded-full border border-[#e5e5e5]">
                Real-time
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence initial={false}>
                {attendees.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-2.5 rounded-xl bg-[#fafafa] hover:bg-[#e6eff8]/60 border border-[#e5e5e5] hover:border-[#bfdbfe] flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] flex items-center justify-center font-bold text-xs shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#222222] leading-tight">{a.student_name}</p>
                        <p className="text-[10px] text-[#9e9e9e] mt-0.5 font-mono">
                          {new Date(a.checked_in_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[9px] border-[#e5e5e5] bg-white text-[#616161] px-2 py-0.5">
                      {a.method === 'manual' ? 'Manual' : 'QR Scan'}
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>

              {attendees.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9e9e9e]">
                  <QrCode className="w-8 h-8 mb-2 opacity-30 text-[#004e9e]" />
                  <p className="text-xs font-medium text-[#616161]">Waiting for trainees to scan...</p>
                  <p className="text-[11px] text-[#9e9e9e] mt-0.5">Scanned check-ins will appear live</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Standardized Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-[#e5e5e5] text-center text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Creativa Aswan Team &bull; Session Attendance Presenter Mode
      </footer>
    </div>
  );
}