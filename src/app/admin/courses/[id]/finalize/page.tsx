'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Calculator, CheckCircle2, Lock, AlertTriangle, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EligibilitySnapshot } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Step = 'idle' | 'calculating' | 'review' | 'confirm' | 'locking' | 'done';

export default function FinalizePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [step, setStep] = useState<Step>('idle');
  const [snapshot, setSnapshot] = useState<EligibilitySnapshot | null>(null);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState({ reviewed: false, confirmed: false });
  const [filter, setFilter] = useState<'all' | 'eligible' | 'ineligible'>('all');

  const calculate = async () => {
    setStep('calculating');
    setError('');
    try {
      const res = await fetch(`/api/courses/${courseId}/calculate`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setSnapshot(json.data);
        setStep('review');
      } else {
        setError(json.error ?? 'Calculation failed');
        setStep('idle');
      }
    } catch {
      setError('Connection error');
      setStep('idle');
    }
  };

  const handleLock = async () => {
    setStep('locking');
    try {
      const res = await fetch(`/api/courses/${courseId}/finalize`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setStep('done');
      } else {
        setError(json.error ?? 'Lock failed');
        setStep('confirm');
      }
    } catch {
      setError('Connection error during finalization');
      setStep('confirm');
    }
  };

  const filteredStudents =
    snapshot?.students.filter((s) =>
      filter === 'all' ? true : filter === 'eligible' ? s.is_eligible : !s.is_eligible
    ) ?? [];

  if (step === 'done') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto selection:bg-[#004e9e] selection:text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border border-[#e5e5e5] bg-white text-center p-6 sm:p-8 my-4">
            <div className="w-12 h-12 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge variant="success" className="mb-2 text-[10px] px-2.5 py-0.5">Finalization Complete</Badge>
            <h1 className="text-xl font-bold text-[#222222] tracking-tight mb-1.5">
              Course Successfully Finalized
            </h1>
            <p className="text-[#616161] text-xs max-w-md mx-auto mb-6 leading-relaxed">
              Attendance records are permanently locked. Download the comprehensive Master Spreadsheet with all session timestamps or the official Certificate Roster.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Button variant="primary" size="sm" asChild className="gap-1.5 h-9 font-semibold">
                <a href={`/api/courses/${courseId}/export?format=master`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Master Sheet (.XLSX)
                </a>
              </Button>
              <Button variant="secondary" size="sm" asChild className="gap-1.5 h-9 font-semibold">
                <a href={`/api/courses/${courseId}/export?format=eligibility`}>
                  <Download className="w-3.5 h-3.5" /> Certificate Roster (.XLSX)
                </a>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e5e5e5]">
              <Link
                href={`/admin/courses/${courseId}`}
                className="text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
              >
                &larr; Return to Course Overview
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto selection:bg-[#004e9e] selection:text-white space-y-5">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#616161] hover:text-[#004e9e] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
      </Link>

      {/* 4-Step Progress Indicator */}
      <Card className="border border-[#e5e5e5] bg-white p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: 0, label: '1. Calculate' },
            { id: 1, label: '2. Review' },
            { id: 2, label: '3. Confirm' },
            { id: 3, label: '4. Lock & Export' },
          ].map((s) => {
            const stepIdx = { idle: 0, calculating: 0, review: 1, confirm: 2, locking: 3, done: 4 }[step];
            const isDone = s.id < stepIdx;
            const isCurrent = s.id === stepIdx;

            return (
              <div
                key={s.id}
                className={`py-1.5 px-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center ${
                  isCurrent
                    ? 'bg-[#004e9e] text-white'
                    : isDone
                    ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                    : 'bg-[#fafafa] text-[#9e9e9e] border border-[#e5e5e5]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : null}
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Step 1: Calculate */}
      {(step === 'idle' || step === 'calculating') && (
        <Card className="border border-[#e5e5e5] bg-white max-w-lg">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#e6eff8] text-[#004e9e] flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#222222]">Step 1 &bull; Calculate Eligibility</h2>
                <span className="text-xs text-[#616161]">Run server calculation for all registered attendees</span>
              </div>
            </div>

            <p className="text-[#616161] text-xs leading-relaxed mb-5">
              The system audits all recorded session QR entries against the total closed sessions for this cohort and calculates the exact percentage required for certificate issuance.
            </p>

            <Button
              variant="primary"
              size="sm"
              onClick={calculate}
              disabled={step === 'calculating'}
              className="h-9 px-5 font-semibold"
            >
              {step === 'calculating' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" /> Start Evaluation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 'review' && snapshot && (
        <div className="space-y-5">
          <Card className="border border-[#e5e5e5] bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold text-[#222222]">
                    Step 2 &bull; Attendance &amp; Eligibility Audit
                  </h2>
                  <p className="text-[#616161] text-xs mt-0.5">
                    Review trainee percentages and inspect missing details before locking
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep('confirm')}
                  className="h-9 px-4 font-semibold"
                >
                  Proceed to Confirm &rarr;
                </Button>
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">Total Cohort</span>
                  <span className="text-lg font-bold text-[#222222] font-mono mt-0.5 block">
                    {snapshot.total_students}
                  </span>
                </div>
                <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-[#047857] uppercase tracking-wider block">Eligible</span>
                  <span className="text-lg font-bold text-[#047857] font-mono mt-0.5 block">
                    {snapshot.eligible_count}
                  </span>
                </div>
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-[#b45309] uppercase tracking-wider block">Ineligible</span>
                  <span className="text-lg font-bold text-[#b45309] font-mono mt-0.5 block">
                    {snapshot.not_eligible_count}
                  </span>
                </div>
                <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-[#616161] uppercase tracking-wider block">Threshold</span>
                  <span className="text-lg font-bold text-[#222222] font-mono mt-0.5 block">
                    {snapshot.min_attendance_pct}%{' '}
                    <span className="text-xs font-normal text-[#9e9e9e]">({snapshot.required_sessions} sessions)</span>
                  </span>
                </div>
              </div>

              {/* Missing email warning */}
              {snapshot.missing_email_count > 0 && (
                <div className="p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-[#b45309] text-xs flex items-start gap-2 mb-5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#b45309] mt-0.5" />
                  <div>
                    <strong className="font-bold">Missing Email Notice:</strong> {snapshot.missing_email_count} trainee(s) do not have an email address on file.
                  </div>
                </div>
              )}

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5">
                {(['all', 'eligible', 'ineligible'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                      filter === f
                        ? 'bg-[#004e9e] text-white'
                        : 'bg-[#fafafa] text-[#616161] border border-[#e5e5e5] hover:text-[#004e9e]'
                    }`}
                  >
                    {f === 'all'
                      ? `All (${snapshot.total_students})`
                      : f === 'eligible'
                      ? `Eligible (${snapshot.eligible_count})`
                      : `Ineligible (${snapshot.not_eligible_count})`}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-xl border border-[#e5e5e5] overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-[#fafafa] border-b border-[#e5e5e5] text-[#616161] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Trainee Name</th>
                      <th className="px-4 py-2.5">Email Address</th>
                      <th className="px-4 py-2.5">Attended</th>
                      <th className="px-4 py-2.5">Rate</th>
                      <th className="px-4 py-2.5">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {filteredStudents.map((s) => (
                      <tr key={s.student_id} className="hover:bg-[#fafafa]/80">
                        <td className="px-4 py-2.5 font-bold text-[#222222]">{s.student_name}</td>
                        <td className="px-4 py-2.5 text-[#616161] font-mono text-[11px]">{s.email || '—'}</td>
                        <td className="px-4 py-2.5 font-mono">
                          {s.sessions_attended} / {s.total_sessions}
                        </td>
                        <td className="px-4 py-2.5 font-bold font-mono text-[#222222]">
                          {s.attendance_pct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={s.is_eligible ? 'success' : 'secondary'} className="text-[10px] px-2 py-0.5">
                            {s.is_eligible ? 'Eligible' : 'Ineligible'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Confirm */}
      {(step === 'confirm' || step === 'locking') && snapshot && (
        <Card className="border border-[#e5e5e5] bg-white max-w-lg">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#b45309] border border-[#fde68a] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#222222]">Step 3 &bull; Confirm &amp; Finalize</h2>
                <span className="text-xs text-[#616161]">Coordinator verification lock</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e5e5e5] text-xs text-[#616161] mb-5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#616161]">Course Cohort:</span>
                <strong className="text-[#222222] font-semibold">{snapshot.course_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#616161]">Total Eligible Trainees:</span>
                <strong className="text-[#047857] font-semibold">{snapshot.eligible_count} of {snapshot.total_students}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#616161]">Min. Attendance:</span>
                <strong className="text-[#222222] font-semibold">{snapshot.min_attendance_pct}%</strong>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-[#e5e5e5] hover:bg-[#fafafa] transition-colors">
                <input
                  type="checkbox"
                  checked={checks.reviewed}
                  onChange={(e) => setChecks((c) => ({ ...c, reviewed: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-[#004e9e] accent-[#004e9e] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#222222] leading-tight">
                  I have audited all attendance records and verified eligibility.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-[#e5e5e5] hover:bg-[#fafafa] transition-colors">
                <input
                  type="checkbox"
                  checked={checks.confirmed}
                  onChange={(e) => setChecks((c) => ({ ...c, confirmed: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded text-[#004e9e] accent-[#004e9e] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#222222] leading-tight">
                  I confirm locking this course for official certificate generation and roster export.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('review')}
                disabled={step === 'locking'}
                className="h-9 px-3"
              >
                &larr; Back
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleLock}
                disabled={!checks.reviewed || !checks.confirmed || step === 'locking'}
                className="gap-1.5 font-bold h-9 px-4"
              >
                {step === 'locking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Lock &amp; Finalize Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}