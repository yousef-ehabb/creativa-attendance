/* eslint-disable @next/next/no-location-assign-relative-destination */
'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#fafafa', color: '#222' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#b91c1c', fontSize: '20px' }}>
              !
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#222' }}>Application Error</h2>
            <p style={{ fontSize: '12px', color: '#616161', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              A fatal error occurred while loading this page. Please try reloading.
            </p>
            {error?.digest && (
              <p style={{ fontSize: '10px', color: '#9e9e9e', fontFamily: 'monospace', margin: '0 0 16px 0' }}>
                Code: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{ width: '100%', height: '40px', background: '#004e9e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{ width: '100%', height: '40px', background: 'transparent', color: '#616161', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Return to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
