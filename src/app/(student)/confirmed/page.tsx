'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { CheckCircle2, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function ConfirmedContent() {
  const router = useRouter();
  const params = useSearchParams();
  const courseName = params.get('course');
  const sessionNumber = params.get('session');
  const studentName = params.get('name');

  return (
    <div className="min-h-screen subtle-mesh flex flex-col justify-between p-4 sm:p-6 selection:bg-[#004e9e] selection:text-white">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-[#e5e5e5]">
            <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-[#222222] block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[11px] font-medium text-[#9e9e9e]">Trainee Attendance Portal</span>
          </div>
        </div>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border border-[#e5e5e5] bg-white overflow-hidden">
            <CardContent className="p-6 sm:p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 rounded-full bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>

              <Badge variant="success" className="mb-2">
                <Sparkles className="w-3 h-3 text-[#10b981]" /> Attendance Recorded
              </Badge>
              <h1 className="text-2xl font-extrabold text-[#222222] tracking-tight mb-1.5">
                {studentName ? `Welcome, ${studentName}!` : 'Registration Complete!'}
              </h1>
              <p className="text-xs text-[#616161] mb-5 leading-relaxed max-w-xs mx-auto">
                Your profile has been created and your attendance for today&apos;s session has been successfully recorded.
              </p>

              {/* Course / Session Confirmation Details */}
              {(courseName || sessionNumber) && (
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] mb-5 text-left space-y-2.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
                  {courseName && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#616161] font-medium">Course Cohort:</span>
                      <strong className="text-[#222222] font-bold">{courseName}</strong>
                    </div>
                  )}
                  {sessionNumber && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#616161] font-medium">Session Number:</span>
                      <strong className="text-[#004e9e] font-mono font-bold bg-[#e6eff8] px-2.5 py-0.5 rounded-full border border-[#bfdbfe]">
                        Session #{sessionNumber}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] mb-6 text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#222222]">Instant Auto-Recognition</p>
                  <p className="text-[11px] text-[#616161] leading-normal mt-0.5">
                    For all future sessions, simply point your camera at the room QR code and your check-in will be verified in 1 second.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  className="w-full h-11 font-bold"
                  onClick={() => router.push('/my-courses')}
                >
                  <BookOpen className="w-4 h-4" /> View My Courses
                </Button>
                <Button
                  variant="secondary"
                  className="w-full h-11"
                  onClick={() => router.push('/')}
                >
                  Return to Scanner
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="text-center py-2 text-[11px] text-[#9e9e9e]">
        Creativa Aswan Team
      </footer>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-[#616161]">Loading confirmation...</div>}>
      <ConfirmedContent />
    </Suspense>
  );
}