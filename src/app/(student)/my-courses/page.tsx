'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Loader2, ShieldCheck, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MyCoursesPage() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem('creativa_student_id');
    setStudentId(sid);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen subtle-mesh flex flex-col justify-between p-4 sm:p-6 selection:bg-[#004e9e] selection:text-white">
      <div className="w-full max-w-lg mx-auto pt-2 sm:pt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
          </Link>
          <Badge variant="success">
            <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> Pass Active
          </Badge>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Header Paper Card */}
          <Card className="border border-[#e5e5e5] bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center">
                  <Image src="/logo.png" alt="Creativa Hub Logo" width={36} height={36} className="object-contain" priority />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-[#222222] tracking-tight">
                    My Enrolled Courses
                  </h1>
                  <p className="text-xs text-[#616161]">
                    Creativa Innovation Hubs &bull; Trainee Attendance Pass
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="p-12 text-center text-[#9e9e9e] text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#004e9e]" />
              Loading course records...
            </div>
          ) : !studentId ? (
            <Card className="border border-[#e5e5e5] bg-white p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fafafa] border border-[#e5e5e5] text-[#9e9e9e] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#222222] mb-1">No Active Pass Found</h3>
              <p className="text-xs text-[#616161] mb-6 max-w-xs mx-auto">
                Please scan the session QR code in your classroom or re-link your registered phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button variant="primary" asChild>
                  <Link href="/">Open Camera Scanner</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/relink">Re-link Existing Phone</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border border-[#e5e5e5] bg-white p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] flex items-center justify-center mx-auto mb-3">
                <Award className="w-7 h-7" />
              </div>
              <Badge variant="success" className="mb-2">Device Pass Active</Badge>
              <h3 className="text-base font-bold text-[#222222] mb-1">Profile Connected</h3>
              <p className="text-xs text-[#616161] mb-6 max-w-xs mx-auto">
                Your profile is linked to this device. When you scan the room QR code in class, your attendance is recorded instantly.
              </p>
              <Button variant="primary" className="w-full h-11" asChild>
                <Link href="/">Scan Next Session QR</Link>
              </Button>
            </Card>
          )}
        </motion.div>
      </div>

      <footer className="py-4 text-center text-[11px] text-[#9e9e9e]">
        Creativa Aswan Team
      </footer>
    </div>
  );
}