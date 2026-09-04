/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError] Unhandled fatal error caught by root boundary:', error);
  }, [error]);

  const handleRetry = () => {
    try {
      if (typeof retry === 'function') {
        retry();
      } else if (typeof reset === 'function') {
        reset();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  const handleHome = () => {
    try {
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Creativa Hub — Attendance Notice</title>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#fafafa',
          color: '#222222',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 78, 158, 0.08)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <img src="/logo.png" alt="Creativa Hub Logo" width="28" height="28" style={{ objectFit: 'contain' }} />
          </div>

          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: '#b91c1c',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            !
          </div>

          <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 6px 0', color: '#222222' }}>
            Attendance Session Notice
          </h2>
          <p style={{ fontSize: '12px', color: '#616161', lineHeight: '1.55', margin: '0 0 16px 0' }}>
            The session link could not be loaded or has expired. You can scan the fresh QR code in the classroom to continue.
          </p>

          {error?.digest && (
            <p
              style={{
                fontSize: '10px',
                color: '#9e9e9e',
                fontFamily: 'monospace',
                background: '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '6px',
                margin: '0 0 16px 0',
                display: 'inline-block',
              }}
            >
              Ref: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                width: '100%',
                height: '42px',
                background: '#004e9e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 78, 158, 0.25)',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={handleHome}
              style={{
                width: '100%',
                height: '42px',
                background: '#ffffff',
                color: '#222222',
                border: '1px solid #e5e5e5',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Open Classroom Scanner
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
