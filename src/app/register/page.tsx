'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, CheckCircle2, User, Mail, Phone, CreditCard, ShieldCheck, ArrowLeft, AlertCircle, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const it = params.get('it') ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', national_id: '' });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.full_name.trim();
    if (!trimmedName || !form.email.trim() || !form.phone.trim()) {
      setError('Please provide your full name, email address, and phone number.');
      return;
    }
    const englishNameRegex = /^[a-zA-Z\s.'-]+$/;
    if (!englishNameRegex.test(trimmedName)) {
      setError('Please enter your full name in English letters only.');
      return;
    }
    const words = trimmedName.split(/\s+/);
    if (words.length < 2) {
      setError('Please enter at least your first and last name in English (e.g. Ahmed Ali).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent_token: it, ...form }),
      });
      const json = await res.json();
      if (json.ok) {
        localStorage.setItem('creativa_device_token', json.data.device_token);
        localStorage.setItem('creativa_student_id', json.data.student_id);
        const confirmParams = new URLSearchParams({
          course: json.data.course_name ?? '',
          session: String(json.data.session_number ?? ''),
          name: json.data.student_name ?? '',
        });
        router.replace(`/confirmed?${confirmParams.toString()}`);
      } else {
        setError(json.error ?? 'Registration could not be completed.');
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
          {/* Subtle Ambient Radial Glow */}
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eff8] text-[#004e9e] text-[10px] font-bold border border-[#bfdbfe] shadow-[0_0_12px_rgba(0,78,158,0.15)] mb-2.5">
                    <Sparkles className="w-3 h-3 text-[#f8af43]" /> One-Time Profile Setup
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
                    Trainee Profile
                  </h1>
                  <p className="text-[#616161] text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Your device pass will automatically authenticate you for all future classroom sessions.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#222222]">
                        Full Name (English only) <span className="text-[#ef4444]">*</span>
                      </label>
                      {form.full_name && !/^[a-zA-Z\s.'-]*$/.test(form.full_name) && (
                        <span className="text-[10px] font-semibold text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline" /> English letters only
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type="text"
                        value={form.full_name}
                        onChange={set('full_name')}
                        placeholder="e.g. Ahmed Mahmoud Ali"
                        required
                        className={`pl-11 ${
                          form.full_name && !/^[a-zA-Z\s.'-]*$/.test(form.full_name)
                            ? 'border-[#ef4444] focus-visible:ring-[#ef4444]'
                            : ''
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-[#9e9e9e] mt-1 font-medium">
                      Official certificates and records will be issued using this English name.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222222] mb-1.5">
                      Email Address <span className="text-[#ef4444]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="ahmed@example.com"
                        required
                        className="pl-11"
                      />
                    </div>
                    <p className="text-[10px] text-[#9e9e9e] mt-1 font-medium">Official certificates will be dispatched to this email.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222222] mb-1.5">
                      Phone Number <span className="text-[#ef4444]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="01012345678"
                        required
                        className="pl-11 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222222] mb-1.5">
                      Egyptian National ID <span className="text-[#9e9e9e] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type="text"
                        value={form.national_id}
                        onChange={set('national_id')}
                        placeholder="14-digit National ID"
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
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile &amp; Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Save Profile &amp; Confirm Attendance
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-7 pt-6 border-t border-[#e5e5e5] flex flex-col items-center gap-2 text-center text-xs text-[#616161]">
                  <Link
                    href="/relink"
                    className="font-semibold text-[#004e9e] hover:underline inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Changed phones? Re-link existing profile
                  </Link>
                  <div className="flex items-center gap-1.5 text-[#9e9e9e] text-[11px] mt-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
                    <span>Cryptographic device token stored locally in your browser</span>
                  </div>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-[#616161]">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}