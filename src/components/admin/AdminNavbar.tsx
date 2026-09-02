'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { BookOpen, LogOut, LayoutDashboard, Users, ExternalLink, Sparkles, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: 'Courses & Cohorts', icon: BookOpen, exact: false },
  { href: '/admin/students', label: 'Trainees Directory', icon: Users, exact: false },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Don't show navbar on login or live projector presenter screen
  if (pathname === '/admin/login' || pathname.includes('/live')) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-2.5 sm:top-4 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-md border border-[#e5e5e5] rounded-full px-3 sm:px-4 py-2 shadow-[0_4px_24px_-4px_rgba(0,78,158,0.08),0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0 pl-1">
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center border border-[#e5e5e5] overflow-hidden shadow-xs">
              <Image src="/logo.png" alt="Creativa Hub Logo" width={24} height={24} className="object-contain" priority />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#222222]">Creativa Hub</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#e6eff8] text-[#004e9e] font-bold border border-[#bfdbfe] uppercase">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                    active
                      ? 'bg-[#004e9e] text-white font-bold shadow-[0_2px_10px_rgba(0,78,158,0.25)]'
                      : 'text-[#616161] hover:text-[#004e9e] hover:bg-[#fafafa] font-semibold'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#9e9e9e]'}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#616161] hover:text-[#004e9e] bg-[#fafafa] hover:bg-[#e6eff8] border border-[#e5e5e5] hover:border-[#bfdbfe] transition-all"
            >
              <Sparkles className="w-3 h-3 text-[#f8af43]" />
              <span>Student Scanner</span>
              <ExternalLink className="w-3 h-3 text-[#9e9e9e]" />
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#616161] hover:text-[#b91c1c] hover:bg-[#fef2f2] border border-transparent hover:border-[#fecaca] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-full text-[#616161] hover:text-[#222222] hover:bg-[#fafafa] transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#222222]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Glass Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 p-3 bg-white/95 backdrop-blur-md border border-[#e5e5e5] rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] space-y-1.5"
            >
              {navItems.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-xs transition-all ${
                      active
                        ? 'bg-[#004e9e] text-white font-bold'
                        : 'text-[#616161] hover:text-[#004e9e] hover:bg-[#fafafa] font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between gap-2 px-1">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#004e9e] py-1.5 px-3 rounded-full hover:bg-[#e6eff8]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#f8af43]" />
                  <span>Student Scanner</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#b91c1c] py-1.5 px-3 rounded-full hover:bg-[#fef2f2] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
