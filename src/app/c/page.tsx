'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

function CheckinRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const t = params.get('t');

  useEffect(() => {
    if (!t) {
      router.replace('/');
      return;
    }
    const deviceToken = localStorage.getItem('creativa_device_token');
    if (deviceToken) {
      router.replace(`/checkin?t=${encodeURIComponent(t)}`);
    } else {
      router.replace(`/register?t=${encodeURIComponent(t)}`);
    }
  }, [t, router]);

  return (
    <div className="min-h-screen subtle-mesh flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
        </div>
        <Loader2 className="w-6 h-6 text-[#004e9e] animate-spin mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#222222]">Connecting Session...</h3>
        <p className="text-xs text-[#616161] mt-1">Routing to your trainee attendance pass</p>
      </div>
    </div>
  );
}

export default function CheckinRouterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs text-[#616161]">Connecting...</div>}>
      <CheckinRedirect />
    </Suspense>
  );
}