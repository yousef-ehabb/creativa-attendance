'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, ArrowRight } from 'lucide-react';

export function ClientBridge({ intentToken }: { intentToken: string }) {
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let target = `/register?it=${encodeURIComponent(intentToken)}`;
    try {
      if (typeof window !== 'undefined') {
        const deviceToken = localStorage.getItem('creativa_device_token');
        if (deviceToken) {
          target = `/checkin?it=${encodeURIComponent(intentToken)}`;
        }
      }
    } catch {
      // In restricted WebViews or private browsing, fallback to register
      target = `/register?it=${encodeURIComponent(intentToken)}`;
    }

    setDestinationUrl(target);

    // Native browser replace ensures top-level document navigation
    // eliminating SPA router transition aborts from Android camera intents
    try {
      window.location.replace(target);
    } catch {
      window.location.href = target;
    }

    // Safety fallback: if navigation takes longer than 2.5s on a slow device
    const timer = setTimeout(() => {
      setShowManual(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [intentToken]);

  const handleManualContinue = () => {
    if (destinationUrl) {
      window.location.href = destinationUrl;
    }
  };

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
        </div>
        <Loader2 className="w-6 h-6 text-[#004e9e] animate-spin mx-auto mb-2.5" />
        <h3 className="text-sm font-bold text-[#222222]">Connecting Session...</h3>
        <p className="text-xs text-[#616161] mt-1 leading-relaxed">
          Routing to your trainee attendance pass...
        </p>

        {showManual && destinationUrl && (
          <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
            <button
              type="button"
              onClick={handleManualContinue}
              className="w-full h-9 text-xs font-semibold gap-1.5 text-[#004e9e] bg-[#e6eff8] hover:bg-[#d0e3f5] rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              Continue Manually <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
