'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, CheckCircle2, Mail, Phone, ArrowLeft, AlertCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RelinkDevicePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) {
      setError('Please provide both your registered email and phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/students/relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        localStorage.setItem('creativa_device_token', json.data.device_token);
        localStorage.setItem('creativa_student_id', json.data.student_id);
        setSuccess(true);
        setTimeout(() => {
          router.push('/my-courses');
        }, 1200);
      } else {
        setError(json.error ?? 'Verification failed. Please check your credentials.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      <div className="w-full max-w-md mx-auto pt-2 sm:pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors mb-5 sm:mb-7 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#e5e5e5] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Scanner
        </Link>

        <div className="relative">
          <div className="absolute -inset-3 sm:-inset-4 rounded-[2.5rem] bg-gradient-to-b from-[#004e9e]/15 via-[#f8af43]/8 to-transparent blur-2xl -z-10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border border-[#e5e5e5] bg-white shadow-[0_12px_40px_-8px_rgba(0,78,158,0.08)] overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_16px_rgba(0,78,158,0.08)]">
                    <Image src="/logo.png" alt="Creativa Hub Logo" width={40} height={40} className="object-contain" priority />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
                    Re-link Device Pass
                  </h1>
                  <p className="text-[#616161] text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Switched phones or changed browsers? Enter your registered credentials to restore your attendance pass.
                  </p>
                </div>

                {success ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#ecfdf5] border-2 border-[#a7f3d0] text-[#047857] flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#222222]">Device Pass Restored!</h3>
                    <p className="text-xs text-[#616161] mt-1">Redirecting to your course dashboard...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#222222] mb-1.5">
                        Registered Email Address <span className="text-[#ef4444]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ahmed@example.com"
                          required
                          className="pl-11"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#222222] mb-1.5">
                        Registered Phone Number <span className="text-[#ef4444]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01012345678"
                          required
                          className="pl-11 font-mono"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-start gap-2.5 shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-12 text-sm font-bold mt-2 shadow-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" /> Link This Device
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <div className="mt-7 pt-6 border-t border-[#e5e5e5] text-center">
                  <Link href="/register" className="text-xs font-semibold text-[#004e9e] hover:underline transition-colors">
                    New student? Register here &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <footer className="py-4 text-center text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Creativa Aswan Team
      </footer>
    </div>
  );
}