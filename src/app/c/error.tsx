'use client';

import { useEffect } from 'react';

export default function CheckinError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error('[/c] Route error encountered:', error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === 'function') {
      retry();
    } else if (typeof reset === 'function') {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-2 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#b91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-[#222222]">QR Code Expired or Invalid</h3>
        <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
          The attendance session could not be verified or the QR code has expired.
        </p>

        {error?.digest && (
          <p className="text-[10px] text-[#9e9e9e] font-mono mt-2">
            ID: {error.digest}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full h-10 text-xs font-bold text-white bg-[#004e9e] hover:bg-[#003b78] rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="w-full h-10 text-xs font-medium text-[#222222] bg-white hover:bg-[#fafafa] border border-[#e5e5e5] rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            Open Classroom Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
