'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { GetEvaluationResponse, EvaluationResult, Dimension } from '@/lib/types';

// ─── Score Color Helper ───
function getScoreColor(score: number | null, max: number): string {
  if (score === null) return 'text-slate-400';
  const pct = (score / max) * 100;
  if (pct >= 90) return 'text-emerald-600';
  if (pct >= 70) return 'text-blue-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number | null, max: number): string {
  if (score === null) return 'bg-slate-100';
  const pct = (score / max) * 100;
  if (pct >= 90) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 70) return 'bg-blue-50 border-blue-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getGradeBadge(grade: string): { bg: string; text: string } {
  switch (grade) {
    case 'ELITE': return { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800' };
    case 'STRONG': return { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800' };
    case 'INCONSISTENT': return { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800' };
    case 'AT RISK': return { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800' };
    case 'FAIL': return { bg: 'bg-red-100 border-red-300', text: 'text-red-800' };
    default: return { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800' };
  }
}

function getBarWidth(score: number | null, max: number): string {
  if (score === null) return '0%';
  return `${Math.round((score / max) * 100)}%`;
}

function getBarColor(score: number | null, max: number): string {
  if (score === null) return 'bg-slate-300';
  const pct = (score / max) * 100;
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-blue-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── Dimension Card Component ───
function DimensionCard({ dim, forceOpen }: { dim: Dimension; forceOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const showDetails = forceOpen || isOpen;

  return (
    <div className="dimension-card bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300/80">
      {/* Header — clickable to expand */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left no-print"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`shrink-0 w-14 h-14 rounded-xl border flex flex-col items-center justify-center ${getScoreBg(dim.score, dim.max_score)}`}>
            <span className={`text-lg font-bold leading-none ${getScoreColor(dim.score, dim.max_score)}`}>
              {dim.score !== null ? dim.score : '—'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">/{dim.max_score}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dim.id}</span>
              {dim.pillar && (
                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {dim.pillar}
                </span>
              )}
              {dim.disabled && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  DISABLED
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800 mt-0.5 truncate">{dim.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreBg(dim.score, dim.max_score)} ${getScoreColor(dim.score, dim.max_score)}`}>
            {dim.band}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Score Bar */}
      <div className="px-5 sm:px-6 pb-1 no-print">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor(dim.score, dim.max_score)}`}
            style={{ width: getBarWidth(dim.score, dim.max_score) }}
          />
        </div>
      </div>

      {/* Expandable Details */}
      <div className={`px-5 sm:px-6 pb-6 pt-4 space-y-4 border-t border-slate-100 mt-2 ${showDetails ? 'block' : 'hidden print:block'} print-expand`}>
        {dim.disabled && dim.disabled_reason && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 italic">
            {dim.disabled_reason}
          </div>
        )}

        {/* Reasoning */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reasoning</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{dim.reasoning}</p>
        </div>

        {/* Verbatim Evidence */}
        {dim.verbatim_quotes.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Verbatim Evidence ({dim.verbatim_quotes.length})
            </h4>
            <div className="space-y-2">
              {dim.verbatim_quotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-700 border-l-4 border-l-blue-500 leading-relaxed"
                >
                  &ldquo;{quote}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Fix */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Quick Fix</h4>
          <p className="text-sm text-blue-900 font-medium leading-relaxed">{dim.quick_fix}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ───
export default function EvaluationResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [evaluation, setEvaluation] = useState<GetEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [expandAll, setExpandAll] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const statusRef = useRef<string>('pending');

  const fetchEvaluation = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations/${id}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) {
          setError('Evaluation not found. The link may be invalid.');
          return;
        }
        throw new Error('Failed to fetch evaluation');
      }
      const data: GetEvaluationResponse = await res.json();
      setEvaluation(data);
      statusRef.current = data.status;
      setPollCount(prev => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);

  // Initial fetch + polling
  useEffect(() => {
    fetchEvaluation();

    const interval = setInterval(() => {
      if (statusRef.current === 'completed' || statusRef.current === 'failed') {
        clearInterval(interval);
        return;
      }
      fetchEvaluation();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchEvaluation]);

  // 1-Click Retry Action
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to retry');
      statusRef.current = 'processing';
      setEvaluation(prev => prev ? { ...prev, status: 'processing', error_message: null } : null);
      const interval = setInterval(() => {
        if (statusRef.current === 'completed' || statusRef.current === 'failed') {
          clearInterval(interval);
          return;
        }
        fetchEvaluation();
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRetrying(false);
    }
  };

  // ─── Direct Automatic PDF Downloader ───
  const handleDownloadPdf = async () => {
    if (!evaluation || !evaluation.score_data) return;
    setIsDownloadingPdf(true);
    setExpandAll(true); // expand all sections for the PDF

    try {
      // Dynamically import html2pdf for client-side rendering
      const html2pdfModule = (await import('html2pdf.js')).default;
      const element = document.getElementById('report-export-container');
      if (!element) return;

      const typeLabel = evaluation.call_type === 'kickoff' ? 'Kickoff' : 'Coaching';
      const score = evaluation.score_data.total_score;
      const maxScore = evaluation.score_data.max_possible;
      const grade = evaluation.score_data.grade_stage;
      const filename = `${typeLabel}_Call_Evaluation_${grade}_${score}of${maxScore}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdfModule().set(opt).from(element).save();
    } catch (err) {
      console.error('Direct PDF error, falling back to window.print():', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-red-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <a href="/" className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ─── Loading / Processing State ───
  if (!evaluation || evaluation.status === 'pending' || evaluation.status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-indigo-300 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyzing Transcript...</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The AI is scoring the call against all 12 rubric dimensions, extracting verbatim evidence, checking automatic caps, and building the report.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Polling for results... ({pollCount})
          </div>
          <p className="text-xs text-slate-400 mt-4">
            You can safely close this tab and return later using this URL.
          </p>
        </div>
      </div>
    );
  }

  // ─── Failed State (With 1-Click Retry) ───
  if (evaluation.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-red-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Evaluation Failed</h2>
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-mono text-red-800 text-left mb-6 overflow-x-auto leading-relaxed">
            {evaluation.error_message || 'An unknown error occurred during evaluation.'}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isRetrying ? 'Retrying...' : '🔄 Retry Evaluation'}
            </button>
            <a href="/" className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
              ← New Call
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Completed State ───
  const data = evaluation.score_data as EvaluationResult;
  if (!data) return null;

  const gradeBadge = getGradeBadge(data.grade_stage);
  const scorePct = Math.round((data.total_score / data.max_possible) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header / Actions */}
        <div className="flex items-center justify-between no-print">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            New Evaluation
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <span className="text-xs text-slate-400 font-mono">ID: {id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Export Container for PDF */}
        <div id="report-export-container" className="space-y-6">

          {/* Score Hero Card */}
          <div className="hero-card bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {evaluation.call_type === 'kickoff' ? '🚀 Kick-off Call' : '🎯 Coaching Call'} Evaluation
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Call Evaluation Report</h1>
                <p className="text-xs text-slate-400 print:block hidden">Halden Method Evaluation System · Run ID: {id}</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-4xl font-black text-slate-900 tracking-tight">
                    {data.total_score}<span className="text-lg font-medium text-slate-400">/{data.max_possible}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <div className={`inline-block px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${gradeBadge.bg} ${gradeBadge.text}`}>
                      {data.grade_stage}
                    </div>
                    {data.max_possible === 85 && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg" title="Dimension 4 (Movement Coaching Quality) was disabled for this call per rubric">
                        D4 N/A (Strategy Call)
                      </span>
                    )}
                  </div>
                </div>
                {/* Circular score indicator */}
                <div className="relative w-16 h-16 shrink-0 no-print">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" stroke="currentColor" strokeWidth="3" fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-blue-600" stroke="currentColor" strokeWidth="3" fill="none"
                      strokeDasharray={`${scorePct}, 100`} strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                    {scorePct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* The One Thing + Red Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="summary-card bg-white rounded-2xl border border-slate-200/80 p-6 border-l-4 border-l-blue-600">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">💡 The One Thing</h3>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">{data.the_one_thing}</p>
            </div>

            {data.red_flags.length > 0 && (
              <div className="summary-card bg-red-50/50 rounded-2xl border border-red-200/80 p-6 border-l-4 border-l-red-500">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">🚩 Red Flags</h3>
                <ul className="space-y-2">
                  {data.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-800 font-medium leading-relaxed flex gap-2">
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* The Brief */}
          <div className="summary-card bg-white rounded-2xl border border-slate-200/80 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📋 The Brief</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{data.the_brief}</p>
          </div>

          {/* Auto Caps */}
          {data.auto_caps_checked.some(c => c.fired) && (
            <div className="summary-card bg-amber-50/50 rounded-2xl border border-amber-200/80 p-6">
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">⚠️ Automatic Caps Triggered</h3>
              <div className="space-y-2">
                {data.auto_caps_checked.filter(c => c.fired).map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-amber-600 font-bold">→</span>
                    <div>
                      <span className="text-amber-900 font-medium">{cap.condition}</span>
                      <span className="text-amber-600 ml-2">({cap.cap_applied})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12 Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Dimensions Breakdown</h2>
              <button
                onClick={() => setExpandAll(!expandAll)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-print"
              >
                {expandAll ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            <div className="space-y-3">
              {data.dimensions.map((dim) => (
                <DimensionCard key={dim.id} dim={dim} forceOpen={expandAll} />
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8 no-print">
          <p className="text-xs text-slate-400">
            Evaluated at {new Date(evaluation.created_at).toLocaleString()} · Run ID: {id}
          </p>
        </div>
      </div>
    </main>
  );
}
