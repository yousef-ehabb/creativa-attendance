'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';

function CheckinRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const t = params.get('t');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!t) {
      router.replace('/');
      return;
    }
    const deviceToken = localStorage.getItem('creativa_device_token');
    if (deviceToken) {
      // Returning student — instant check-in (within QR window)
      router.replace(`/checkin?t=${encodeURIComponent(t)}`);
    } else {
      // First-time student — create a server-side intent so QR rotation
      // does not invalidate the registration that's about to start
      fetch('/api/checkin/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: t }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.ok) {
            router.replace(`/register?it=${encodeURIComponent(json.data.intent_token)}`);
          } else {
            setError(json.error ?? 'Failed to validate QR code.');
          }
        })
        .catch(() => {
          setError('Network error. Please try scanning again.');
        });
    }
  }, [t, router]);

  if (error) {
    return (
      <div className="min-h-screen subtle-mesh flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-2 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-[#b91c1c]" />
          </div>
          <h3 className="text-sm font-bold text-[#222222]">QR Code Error</h3>
          <p className="text-xs text-[#b91c1c] mt-1.5 leading-relaxed">{error}</p>
          <p className="text-xs text-[#616161] mt-2">Please scan the current QR code displayed in the classroom.</p>
        </div>
      </div>
    );
  }

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