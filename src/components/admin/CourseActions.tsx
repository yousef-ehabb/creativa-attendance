'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Calculator, Download, Loader2, RotateCcw, Table, FileSpreadsheet, Sparkles } from 'lucide-react';

interface Props {
  courseId: string;
  status: string;
  activeSessionId?: string;
}

export function CourseActions({ courseId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading('calc');
    try {
      const res = await fetch(`/api/courses/${courseId}/calculate`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        router.push(`/admin/courses/${courseId}/finalize`);
      } else {
        alert(json.error ?? 'Could not calculate eligibility');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReopen = async () => {
    const reason = prompt('Please enter a reason for unlocking this finalized course:');
    if (!reason) return;
    setLoading('reopen');
    try {
      const res = await fetch(`/api/courses/${courseId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.ok) {
        router.refresh();
      } else {
        alert(json.error ?? 'Failed to reopen course');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link
        href={`/admin/courses/${courseId}/matrix`}
        className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white hover:bg-[#fafafa] text-[#222222] border border-[#e5e5e5] hover:border-[#004e9e] hover:shadow-[0_4px_16px_-4px_rgba(0,78,158,0.12)] text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      >
        <Table className="w-3.5 h-3.5 text-[#004e9e]" /> Attendance Matrix
      </Link>

      <a
        href={`/api/courses/${courseId}/export?format=master`}
        className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white hover:bg-[#fafafa] text-[#222222] border border-[#e5e5e5] hover:border-[#004e9e] hover:shadow-[0_4px_16px_-4px_rgba(0,78,158,0.12)] text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        title="Download Master Attendance Spreadsheet with session dates and timestamps"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#004e9e]" /> Master Sheet (.XLSX)
      </a>

      {status === 'finalized' && (
        <>
          <a
            href={`/api/courses/${courseId}/export?format=eligibility`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] hover:shadow-[0_4px_20px_-2px_rgba(16,185,129,0.4)] text-white text-xs font-bold transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Certificate Roster (.XLSX)
          </a>
          <button
            onClick={handleReopen}
            disabled={loading === 'reopen'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#616161] hover:text-[#222222] hover:bg-[#fafafa] border border-transparent hover:border-[#e5e5e5] transition-colors cursor-pointer"
          >
            {loading === 'reopen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reopen Course
          </button>
        </>
      )}

      {(status === 'active' || status === 'draft') && (
        <button
          onClick={handleCalculate}
          disabled={loading === 'calc'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#004e9e] hover:bg-[#003b78] hover:shadow-[0_4px_20px_-2px_rgba(0,78,158,0.35)] active:scale-[0.98] text-white text-xs font-bold transition-all disabled:opacity-60 shadow-md cursor-pointer"
        >
          {loading === 'calc' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Calculator className="w-3.5 h-3.5" />
          )}
          Evaluate &amp; Finalize
        </button>
      )}

      {status === 'reviewing' && (
        <Link
          href={`/admin/courses/${courseId}/finalize`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f8af43] hover:bg-[#e59d30] hover:shadow-[0_4px_20px_-2px_rgba(248,175,67,0.4)] text-[#222222] text-xs font-bold transition-all shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#222222]" /> Review Eligibility Results &rarr;
        </Link>
      )}
    </div>
  );
}