'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-sm w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
        </div>

        <div className="w-10 h-10 rounded-full bg-[#fef2f2] border border-[#fecaca] p-2 flex items-center justify-center mx-auto mb-2 text-[#b91c1c]">
          <AlertTriangle className="w-5 h-5 text-[#b91c1c]" />
        </div>

        <h2 className="text-base font-bold text-[#222222]">Something went wrong</h2>
        <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
          An unexpected loading issue occurred. You can reload this view or return to the main scanner.
        </p>

        {error?.digest && (
          <p className="text-[10px] text-[#9e9e9e] font-mono mt-2">
            Reference ID: {error.digest}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="primary"
            className="w-full h-10 text-xs font-bold gap-2 shadow-sm"
            onClick={() => reset()}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </Button>

          <Button
            variant="outline"
            className="w-full h-10 text-xs font-medium gap-2"
            onClick={() => router.push('/')}
          >
            <Home className="w-3.5 h-3.5" /> Return to Scanner
          </Button>
        </div>
      </div>
    </div>
  );
}
