import Link from 'next/link';
import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { decodeQrPayload, verifyQrPayload } from '@/lib/qr-crypto';
import { issueIntentToken } from '@/lib/device-token';
import { ClientBridge } from './client-bridge';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ControlledErrorCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col items-center justify-center p-4 selection:bg-[#004e9e] selection:text-white">
      <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] text-center max-w-xs w-full shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] p-2 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#b91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-[#222222]">{title}</h3>
        <p className="text-xs text-[#616161] mt-1.5 leading-relaxed font-normal">
          {message}
        </p>
        <p className="text-[11px] text-[#9e9e9e] mt-2">
          Point your phone camera at the active code on the classroom screen.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full h-10 text-xs font-bold text-white bg-[#004e9e] hover:bg-[#003b78] rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            Open Classroom Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function CheckinRoute({ searchParams }: PageProps) {
  try {
    const params = await searchParams;
    const rawToken = typeof params?.t === 'string'
      ? params.t.trim()
      : Array.isArray(params?.t)
      ? params.t[0]?.trim()
      : null;

    if (!rawToken) {
      return (
        <ControlledErrorCard
          title="No Session Code Found"
          message="No QR attendance token was found in this link. Please point your camera at the active code projected on the classroom screen."
        />
      );
    }

    const payload = decodeQrPayload(rawToken);
    if (!payload || !payload.sid || typeof payload.sid !== 'string') {
      return (
        <ControlledErrorCard
          title="Invalid QR Code"
          message="The scanned QR code format is not valid. Please ensure you are scanning the official Creativa attendance code."
        />
      );
    }

    if (!UUID_REGEX.test(payload.sid)) {
      return (
        <ControlledErrorCard
          title="Invalid Session ID"
          message="The session identifier encoded in this QR code is malformed."
        />
      );
    }

    const { data: session, error: dbError } = await supabaseAdmin
      .from('att_sessions')
      .select('id, status, qr_secret')
      .eq('id', payload.sid)
      .single();

    if (dbError || !session) {
      return (
        <ControlledErrorCard
          title="Session Not Found"
          message="The attendance session corresponding to this QR code could not be found. Please check with your coordinator."
        />
      );
    }

    if (session.status !== 'active') {
      return (
        <ControlledErrorCard
          title="Session Inactive"
          message="This attendance session is currently not active or has ended. Contact your classroom coordinator."
        />
      );
    }

    const verify = verifyQrPayload(payload, session.qr_secret);
    if (!verify.ok) {
      const isExpired = verify.reason === 'expired';
      return (
        <ControlledErrorCard
          title={isExpired ? 'QR Code Expired' : 'QR Signature Invalid'}
          message={
            isExpired
              ? 'This QR code has rotated and expired. Please point your camera at the fresh code on the classroom screen.'
              : 'The cryptographic security signature on this code could not be verified. Please scan the current code.'
          }
        />
      );
    }

    // Generate 10-minute intent token that survives rotating QR codes
    const intentToken = await issueIntentToken(session.id);

    return <ClientBridge intentToken={intentToken} />;
  } catch (err: any) {
    console.error('[/c] Fatal server-side error during QR resolution:', err);
    return (
      <ControlledErrorCard
        title="Verification Hiccup"
        message="An unexpected issue occurred while verifying your attendance code. Please try scanning again."
      />
    );
  }
}