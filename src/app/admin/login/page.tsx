'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Lock, Mail, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowser();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message ?? 'Invalid coordinator email or password');
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      <div className="w-full max-w-sm mx-auto pt-6 sm:pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors mb-6 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#e5e5e5] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Trainee Portal
        </Link>

        <div className="relative">
          <div className="absolute -inset-3 sm:-inset-4 rounded-[2.5rem] bg-gradient-to-b from-[#004e9e]/15 via-[#f8af43]/8 to-transparent blur-2xl -z-10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border border-[#e5e5e5] bg-white shadow-[0_12px_40px_-8px_rgba(0,78,158,0.08)] overflow-hidden">
              <CardContent className="p-6 sm:p-9">
                <div className="text-center mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_16px_rgba(0,78,158,0.08)]">
                    <Image src="/logo.png" alt="Creativa Hub Logo" width={40} height={40} className="object-contain" priority />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eff8] text-[#004e9e] text-[10px] font-bold border border-[#bfdbfe] shadow-[0_0_12px_rgba(0,78,158,0.12)] mb-2.5">
                    <Sparkles className="w-3 h-3 text-[#f8af43]" /> Staff Portal
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
                    Coordinator Login
                  </h1>
                  <p className="text-[#616161] text-xs mt-1.5">
                    Creativa Hub Aswan &bull; Attendance &amp; Certification
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#222222] mb-1.5">
                      Coordinator Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="coordinator@creativa.gov.eg"
                        required
                        className="pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222222] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="pl-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#222222] transition-colors cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs leading-relaxed shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                      {error}
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
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      'Sign In to Dashboard'
                    )}
                  </Button>
                </form>

                <div className="mt-7 pt-6 border-t border-[#e5e5e5] flex items-center justify-center gap-1.5 text-[11px] text-[#9e9e9e] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Protected Management Portal</span>
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