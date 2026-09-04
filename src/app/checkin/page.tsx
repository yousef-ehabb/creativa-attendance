'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function getStoredToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('creativa_device_token');
  } catch {
    return null;
  }
}

function clearStoredTokens() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('creativa_device_token');
      localStorage.removeItem('creativa_student_id');
    }
  } catch {}
}

function CheckinProcess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const intentToken = searchParams.get('it') ?? '';
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'need_register'>('checking');
  const [data, setData] = useState<{ course_name?: string; session_number?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [canRetry, setCanRetry] = useState(false);

  const executeCheckin = () => {
    if (!token && !intentToken) {
      setErrorMsg('No active attendance session token provided. Please scan the active room QR code.');
      setStatus('error');
      setCanRetry(false);
      return;
    }

    const deviceToken = getStoredToken();
    if (!deviceToken) {
      setStatus('need_register');
      return;
    }

    setStatus('checking');
    setErrorMsg('');
    setCanRetry(false);

    const bodyPayload = intentToken
      ? { intent_token: intentToken }
      : { qr_token: token };

    fetch('/api/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deviceToken}`,
      },
      body: JSON.stringify(bodyPayload),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setData(json.data);
          setStatus('success');
        } else if (json.code === 'STUDENT_NOT_FOUND' || json.code === 'INVALID_DEVICE_TOKEN') {
          setStatus('need_register');
        } else {
          setErrorMsg(json.error ?? 'Check-in validation failed.');
          setStatus('error');
          setCanRetry(false);
        }
      })
      .catch(() => {
        setErrorMsg('Network connection error. Please verify your connection and try again.');
        setStatus('error');
        setCanRetry(true);
      });
  };

  useEffect(() => {
    executeCheckin();
  }, [token, intentToken]);

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      {/* Top Floating Brand Header with Glass Blur */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur-md border border-[#e5e5e5] rounded-full shadow-[0_4px_20px_-4px_rgba(0,78,158,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center border border-[#e5e5e5] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            <Image src="/logo.png" alt="Creativa Hub Logo" width={28} height={28} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#222222] block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[10px] font-medium text-[#9e9e9e]">Trainee Verification</span>
          </div>
        </div>

        <Badge variant={status === 'success' ? 'success' : 'blue'}>
          {status === 'success' ? 'Verified' : 'Processing'}
        </Badge>
      </header>

      {/* Main Feedback Card with Ambient Glow */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="relative">
          {/* Status-specific ambient glow */}
          <div
            className={`absolute -inset-3 sm:-inset-4 rounded-[2.5rem] blur-2xl -z-10 pointer-events-none transition-all duration-500 ${
              status === 'success'
                ? 'bg-gradient-to-b from-[#10b981]/20 via-[#047857]/10 to-transparent'
                : status === 'error'
                ? 'bg-gradient-to-b from-[#ef4444]/20 via-[#b91c1c]/10 to-transparent'
                : 'bg-gradient-to-b from-[#004e9e]/15 via-[#f8af43]/10 to-transparent'
            }`}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border border-[#e5e5e5] bg-white shadow-[0_12px_40px_-8px_rgba(0,78,158,0.08)] overflow-hidden">
              <CardContent className="p-6 sm:p-9 text-center">
                {status === 'checking' && (
                  <div className="py-8">
                    <div className="w-16 h-16 rounded-full bg-[#e6eff8] text-[#004e9e] border border-[#bfdbfe] flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(0,78,158,0.25)]">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <h2 className="text-xl font-extrabold text-[#222222] mb-1">
                      Verifying Attendance...
                    </h2>
                    <p className="text-xs text-[#616161]">Validating cryptographic room signature</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="py-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="w-18 h-18 rounded-full bg-[#ecfdf5] text-[#047857] border-2 border-[#a7f3d0] flex items-center justify-center mx-auto mb-4 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
                    >
                      <CheckCircle2 className="w-10 h-10" />
                    </motion.div>
                    <Badge variant="success" className="mb-2.5">
                      <Sparkles className="w-3 h-3 text-[#10b981]" /> Attendance Recorded
                    </Badge>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-1.5">
                      You Are Checked In!
                    </h1>
                    <p className="text-xs text-[#616161] mb-6 leading-relaxed">
                      Your presence for today&apos;s session has been successfully recorded.
                    </p>

                    {data?.course_name && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] mb-6 text-left space-y-2.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#616161] font-medium">Course Cohort:</span>
                          <strong className="text-[#222222] font-bold">{data.course_name}</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#616161] font-medium">Session Number:</span>
                          <strong className="text-[#004e9e] font-mono font-bold bg-[#e6eff8] px-2.5 py-0.5 rounded-full border border-[#bfdbfe]">
                            Session #{data.session_number}
                          </strong>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      className="w-full h-12 text-sm font-bold shadow-lg"
                      onClick={() => router.push('/my-courses')}
                    >
                      View Course Progress <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {status === 'need_register' && (
                  <div className="py-3">
                    <div className="w-16 h-16 rounded-full bg-[#e6eff8] text-[#004e9e] border border-[#bfdbfe] flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(0,78,158,0.2)]">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <Badge variant="blue" className="mb-2.5">First Time Setup</Badge>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-2">
                      Welcome to Creativa!
                    </h1>
                    <p className="text-xs text-[#616161] mb-6 leading-relaxed">
                      Please complete your one-time profile registration to permanently link your device.
                    </p>

                    <Button
                      variant="primary"
                      className="w-full h-12 text-sm font-bold mb-3.5 shadow-lg"
                      onClick={() => {
                        clearStoredTokens();
                        if (intentToken) {
                          router.replace(`/register?it=${encodeURIComponent(intentToken)}`);
                        } else if (token) {
                          router.replace(`/c?t=${encodeURIComponent(token)}`);
                        } else {
                          router.replace('/');
                        }
                      }}
                    >
                      Complete Trainee Profile <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Link href="/relink" className="text-xs text-[#616161] hover:text-[#004e9e] font-medium block transition-colors">
                      Already registered? Re-link device &rarr;
                    </Link>
                  </div>
                )}

                {status === 'error' && (
                  <div className="py-3">
                    <div className="w-16 h-16 rounded-full bg-[#fef2f2] text-[#b91c1c] border-2 border-[#fecaca] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                      <XCircle className="w-9 h-9" />
                    </div>
                    <Badge variant="destructive" className="mb-2.5">Check-in Error</Badge>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight mb-2">
                      Verification Failed
                    </h1>
                    <p className="text-xs text-[#b91c1c] mb-6 leading-relaxed bg-[#fef2f2] p-4 rounded-2xl border border-[#fecaca]">
                      {errorMsg}
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {canRetry && (
                        <Button
                          variant="primary"
                          className="w-full h-12 gap-2 font-bold shadow-md"
                          onClick={executeCheckin}
                        >
                          <RefreshCw className="w-4 h-4" /> Retry Check-in
                        </Button>
                      )}
                      <Button
                        variant={canRetry ? "outline" : "primary"}
                        className="w-full h-12 gap-2 font-bold shadow-sm"
                        onClick={() => router.push('/')}
                      >
                        <RefreshCw className="w-4 h-4" /> Scan QR Code Again
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-3 text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Creativa Aswan Team
      </footer>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-[#616161]">Processing check-in...</div>}>
      <CheckinProcess />
    </Suspense>
  );
}