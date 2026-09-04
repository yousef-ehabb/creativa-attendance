'use client';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, AlertCircle, RefreshCw, WifiOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getStoredDeviceToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('creativa_device_token');
  } catch {
    return null;
  }
}

function CheckinRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const t = params.get('t');

  const [statusText, setStatusText] = useState('Connecting to attendance session...');
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [showManualContinue, setShowManualContinue] = useState(false);

  const hasInitiatedRef = useRef(false);
  const isNavigatingRef = useRef(false);

  const processQrIntent = useCallback(async (isManualRetry = false) => {
    if (!t) {
      setError('No QR session token found in this link. Please scan the current code displayed in the classroom.');
      setIsNetworkError(false);
      return;
    }

    if (isManualRetry) {
      setRetrying(true);
    }
    setError(null);
    setIsNetworkError(false);
    setStatusText('Validating session QR code...');

    try {
      // 1. Validate the QR token once and obtain a 10-minute intent token.
      // This protects both first-time and returning students from QR rotation invalidation.
      const res = await fetch('/api/checkin/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: t }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        const errorMsg = json?.error ?? 'Session QR code could not be verified. Please scan the active code in the classroom.';
        setError(errorMsg);
        setIsNetworkError(false);
        return;
      }

      const intentToken = json.data?.intent_token;
      if (!intentToken) {
        setError('Server returned an invalid intent pass. Please try scanning again.');
        setIsNetworkError(false);
        return;
      }

      // 2. Safely inspect whether this device has registered previously
      const deviceToken = getStoredDeviceToken();
      const target = deviceToken
        ? `/checkin?it=${encodeURIComponent(intentToken)}`
        : `/register?it=${encodeURIComponent(intentToken)}`;

      setDestinationUrl(target);
      setStatusText(deviceToken ? 'Connecting to your attendance pass...' : 'Preparing trainee registration...');

      // 3. Initiate client-side navigation now that initial document has settled
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        try {
          router.replace(target);
        } catch {
          // Fallback to hard navigation if router transition stumbles
          window.location.replace(target);
        }
      }
    } catch {
      setIsNetworkError(true);
      setError('Network connection error. Please verify your mobile data or Wi-Fi connection.');
    } finally {
      setRetrying(false);
    }
  }, [t, router]);

  // Initial intent resolution on mount
  useEffect(() => {
    if (!hasInitiatedRef.current && t) {
      hasInitiatedRef.current = true;
      processQrIntent();
    } else if (!t) {
      setError('No QR session token provided. Please scan the active room QR code.');
    }
  }, [t, processQrIntent]);

  // Fallback timer: if navigation takes longer than 2.5s on a slow phone/network, show manual tap button
  useEffect(() => {
    if (destinationUrl) {
      const timer = setTimeout(() => {
        setShowManualContinue(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [destinationUrl]);

  // Manual hard-navigation handler
  const handleManualContinue = () => {
    if (destinationUrl) {
      window.location.replace(destinationUrl);
    }
  };

  // Error State: Network Failure (Shows Retry button)
  if (isNetworkError) {
    return (
      <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] p-2 flex items-center justify-center mx-auto mb-3 text-[#004e9e]">
            <WifiOff className="w-6 h-6 text-[#004e9e]" />
          </div>
          <h3 className="text-sm font-bold text-[#222222]">Connection Hiccup</h3>
          <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
            {error ?? 'Could not reach the attendance server. Please verify your connection.'}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full h-10 text-xs font-bold gap-2 shadow-sm"
              disabled={retrying}
              onClick={() => processQrIntent(true)}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 text-xs font-medium"
              onClick={() => router.push('/')}
            >
              Open Manual Scanner
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error State: Invalid or Expired QR Code
  if (error) {
    return (
      <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-2 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-[#b91c1c]" />
          </div>
          <h3 className="text-sm font-bold text-[#222222]">Session Code Expired</h3>
          <p className="text-xs text-[#b91c1c] mt-1.5 leading-relaxed font-medium">{error}</p>
          <p className="text-xs text-[#616161] mt-2 leading-relaxed">
            Please point your camera at the fresh QR code currently projected on the classroom screen.
          </p>
          <Button
            variant="primary"
            className="w-full h-10 text-xs font-bold mt-4 shadow-sm"
            onClick={() => router.push('/')}
          >
            Open Classroom Scanner
          </Button>
        </div>
      </div>
    );
  }

  // Loading / Routing State
  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e5e5] p-2 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Image src="/logo.png" alt="Creativa Hub Logo" width={32} height={32} className="object-contain" priority />
        </div>
        <Loader2 className="w-6 h-6 text-[#004e9e] animate-spin mx-auto mb-2.5" />
        <h3 className="text-sm font-bold text-[#222222]">Connecting Session...</h3>
        <p className="text-xs text-[#616161] mt-1 leading-relaxed">{statusText}</p>

        {showManualContinue && destinationUrl && (
          <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
            <Button
              variant="outline"
              className="w-full h-9 text-xs font-semibold gap-1.5 text-[#004e9e]"
              onClick={handleManualContinue}
            >
              Continue Manually <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckinRouterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#fafafa] flex items-center justify-center text-xs text-[#616161]">
          Connecting...
        </div>
      }
    >
      <CheckinRedirect />
    </Suspense>
  );
}