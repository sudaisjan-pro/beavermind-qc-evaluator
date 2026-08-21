"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { GetEvaluationResponse, EvaluationResult, Dimension } from "@/lib/types";
import { Zap, ArrowLeft, Download, AlertTriangle, AlertCircle, ChevronDown, Activity, Sparkles, AlertOctagon, CheckCircle2, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getGradeBadge(grade: string) {
  switch (grade) {
    case 'ELITE': return { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> };
    case 'STRONG': return { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-700', icon: <Activity className="w-4 h-4" /> };
    case 'INCONSISTENT': return { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> };
    case 'AT RISK': return { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-700', icon: <AlertCircle className="w-4 h-4" /> };
    case 'FAIL': return { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-700', icon: <AlertOctagon className="w-4 h-4" /> };
    default: return { bg: 'bg-neutral-500/10 border-neutral-500/20', text: 'text-neutral-700', icon: <Info className="w-4 h-4" /> };
  }
}

function getScoreColor(score: number | null, max: number) {
  if (score === null) return "text-neutral-400";
  const pct = (score / max) * 100;
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-blue-600";
  if (pct >= 50) return "text-amber-600";
  return "text-rose-600";
}

function getBarColor(score: number | null, max: number) {
  if (score === null) return "bg-neutral-200";
  const pct = (score / max) * 100;
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-blue-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function DimensionCard({ dim, forceOpen }: { dim: Dimension; forceOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const showDetails = forceOpen || isOpen;
  const scorePct = dim.score !== null ? (dim.score / dim.max_score) * 100 : 0;

  return (
    <div className="dimension-card bg-white/80 backdrop-blur-xl border border-black/[0.04] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4 ring-1 ring-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-5 min-w-0">
          <div className="relative w-16 h-16 shrink-0 flex flex-col items-center justify-center bg-[#FAF8F5] rounded-2xl shadow-inner border border-black/[0.02]">
            <span className={cn("text-xl font-black tracking-tighter leading-none", getScoreColor(dim.score, dim.max_score))}>
              {dim.score !== null ? dim.score : '—'}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase mt-0.5">/{dim.max_score}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">{dim.id}</span>
              {dim.pillar && (
                <span className="text-[10px] font-bold text-[#111113] bg-neutral-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {dim.pillar}
                </span>
              )}
              {dim.disabled && (
                <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  DISABLED
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[#111113] group-hover:text-amber-600 transition-colors tracking-tight leading-snug py-0.5">{dim.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 pl-4">
          <span className={cn("text-[11px] font-black px-3 py-1.5 rounded-xl border tracking-wide uppercase shadow-sm", getGradeBadge(dim.band).bg, getGradeBadge(dim.band).text)}>
            {dim.band}
          </span>
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300", isOpen ? "bg-[#111113] text-white" : "bg-[#FAF8F5] text-neutral-400 group-hover:bg-neutral-200")}>
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
        </div>
      </button>

      {/* Score Bar */}
      <div className="px-6 pb-2">
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", getBarColor(dim.score, dim.max_score))} style={{ width: `${scorePct}%` }} />
        </div>
      </div>

      {/* Expanded State */}
      <div className={cn("px-6 overflow-hidden transition-all duration-300 ease-in-out", showDetails ? "max-h-[2000px] opacity-100 pb-6 pt-4" : "max-h-0 opacity-0")}>
        <div className="space-y-6 pt-4 border-t border-black/[0.04]">
          {dim.disabled && dim.disabled_reason && (
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-sm font-medium text-neutral-500 italic">
              {dim.disabled_reason}
            </div>
          )}

          <div>
            <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Reasoning
            </h4>
            <p className="text-[15px] text-neutral-700 leading-relaxed font-medium">{dim.reasoning}</p>
          </div>

          {dim.verbatim_quotes.length > 0 && (
            <div>
              <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Verbatim Evidence ({dim.verbatim_quotes.length})
              </h4>
              <div className="space-y-3">
                {dim.verbatim_quotes.map((quote, idx) => (
                  <div key={idx} className="verbatim-card bg-[#111113] rounded-2xl p-5 text-sm font-mono text-neutral-300 border-l-[6px] border-l-amber-400 leading-relaxed shadow-lg">
                    "{quote}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {dim.quick_fix && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 rounded-2xl p-5 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-200/50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold text-amber-800 uppercase tracking-widest mb-1.5">Quick Fix</h4>
                <p className="text-[14px] text-amber-950 font-semibold leading-relaxed">{dim.quick_fix}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EvaluationResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [evaluation, setEvaluation] = useState<GetEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [expandAll, setExpandAll] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const statusRef = useRef<string>('pending');

  const fetchEvaluation = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluations/${id}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Evaluation not found. The link may be invalid.');
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

  const handleDownloadPdf = async () => {
    if (!evaluation || !evaluation.score_data) return;
    setIsDownloadingPdf(true);
    setExpandAll(true);
    document.body.classList.add('pdf-export-mode');

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
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
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowWidth: 1024 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.dimension-card', '.summary-card', '.hero-card', '.verbatim-card'] }
      };
      await html2pdfModule().set(opt).from(element).save();
    } catch (err) {
      window.print();
    } finally {
      document.body.classList.remove('pdf-export-mode');
      setIsDownloadingPdf(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 font-sans selection:bg-amber-200 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-200/40 blur-[120px] pointer-events-none" />
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-black/[0.06] p-12 max-w-md text-center shadow-[0_24px_50px_-15px_rgba(0,0,0,0.06)] relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-3xl flex items-center justify-center shadow-inner">
            <AlertOctagon className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-[#111113] mb-3 tracking-tight">Something went wrong</h2>
          <p className="text-[#71717A] mb-8 font-medium">{error}</p>
          <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#111113] hover:bg-[#27272A] text-white rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (!evaluation || evaluation.status === 'pending' || evaluation.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-200/40 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/50 blur-[140px] pointer-events-none" />
        
        <div className="text-center max-w-md relative z-10">
          <div className="relative mx-auto w-24 h-24 mb-10">
            <div className="absolute inset-0 rounded-[2rem] border-4 border-black/[0.04]"></div>
            <div className="absolute inset-0 rounded-[2rem] border-4 border-amber-400 border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-3xl border-4 border-[#111113] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-3xl font-black text-[#111113] mb-4 tracking-tight">Analyzing Transcript...</h2>
          <p className="text-[#6E6D7A] font-medium leading-relaxed mb-8">
            Grading against executive rubrics. Verbatim citations, churn risk detection, and automatic caps in progress.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 border border-black/[0.04] shadow-sm backdrop-blur-md">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Polling for results... ({pollCount})</span>
          </div>
        </div>
      </div>
    );
  }

  if (evaluation.status === 'failed') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-200/40 blur-[120px] pointer-events-none" />
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-black/[0.06] p-10 max-w-xl text-center shadow-[0_24px_50px_-15px_rgba(0,0,0,0.06)] relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-3xl flex items-center justify-center shadow-inner">
            <AlertOctagon className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-[#111113] mb-3 tracking-tight">Evaluation Failed</h2>
          <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-mono text-rose-800 text-left mb-8 overflow-x-auto leading-relaxed font-medium">
            {evaluation.error_message || 'An unknown error occurred during evaluation.'}
          </div>
          <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#111113] hover:bg-[#27272A] text-white rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]">
            <ArrowLeft className="w-4 h-4" />
            Try New Call
          </a>
        </div>
      </div>
    );
  }

  const data = evaluation.score_data as EvaluationResult;
  if (!data) return null;

  const badge = getGradeBadge(data.grade_stage);
  const scorePct = Math.round((data.total_score / data.max_possible) * 100);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#1A1A1E] relative overflow-hidden font-sans selection:bg-amber-200 pb-20">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/50 blur-[140px] pointer-events-none" />

      <header className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between relative z-10 no-print">
        <a href="/" className="flex items-center gap-2 text-sm font-bold text-[#71717A] hover:text-[#111113] transition-colors bg-white/50 px-4 py-2 rounded-xl backdrop-blur-md border border-black/[0.04]">
          <ArrowLeft className="w-4 h-4" />
          New Evaluation
        </a>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase px-3 py-1 bg-white/50 rounded-lg border border-black/[0.04]">ID: {id.slice(0, 8)}</span>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111113] hover:bg-[#27272A] text-white rounded-xl text-xs font-bold shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 relative z-10" id="report-export-container">
        {/* Score Hero Card */}
        <div className="hero-card bg-white/90 backdrop-blur-3xl border border-white rounded-[2.5rem] shadow-[0_24px_50px_-15px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4F1EA] rounded-xl mb-4">
                <span className="text-base">{evaluation.call_type === 'kickoff' ? '🚀' : '🎯'}</span>
                <span className="text-[10px] font-extrabold text-neutral-600 uppercase tracking-widest">
                  {evaluation.call_type === 'kickoff' ? 'Kick-off Call' : 'Coaching Call'}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#111113] tracking-tight mb-2 py-1">Executive Report</h1>
              <p className="text-sm font-medium text-[#71717A] print:block hidden">Halden Method Evaluation System · Run ID: {id}</p>
            </div>
            
            <div className="flex items-center gap-6 bg-[#FAF8F5] p-6 rounded-[2rem] border border-black/[0.04] shadow-inner">
              <div className="text-right flex flex-col justify-center">
                <div className="text-5xl font-black text-[#111113] tracking-tight leading-none mb-2">
                  {data.total_score}<span className="text-2xl text-neutral-400 font-bold ml-0.5">/{data.max_possible}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest", badge.bg, badge.text)}>
                    {badge.icon}
                    {data.grade_stage}
                  </div>
                  {data.max_possible === 85 && (
                    <span className="text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-1 rounded-lg">
                      D4 N/A
                    </span>
                  )}
                </div>
              </div>
              <div className="relative w-24 h-24 shrink-0 no-print drop-shadow-md">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={cn("transition-all duration-1000 ease-out", getScoreColor(data.total_score, data.max_possible))} stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${scorePct}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#111113]">
                  {scorePct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The One Thing + Red Flags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="summary-card bg-gradient-to-br from-[#111113] to-[#27272A] rounded-[2rem] p-8 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.2)] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
              <Zap className="w-32 h-32 text-amber-400" />
            </div>
            <h3 className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
              <Zap className="w-4 h-4" /> The One Thing
            </h3>
            <p className="text-[15px] font-semibold leading-relaxed relative z-10">{data.the_one_thing}</p>
          </div>

          {data.red_flags.length > 0 && (
            <div className="summary-card bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-rose-100 p-8 shadow-[0_24px_50px_-15px_rgba(225,29,72,0.1)] relative">
              <h3 className="text-[11px] font-extrabold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Red Flags
              </h3>
              <ul className="space-y-3">
                {data.red_flags.map((flag, idx) => (
                  <li key={idx} className="text-[14px] text-rose-950 font-semibold leading-relaxed flex gap-3 items-start">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* The Brief */}
        <div className="summary-card bg-white/80 backdrop-blur-xl border border-black/[0.04] rounded-[2rem] p-8 shadow-sm mb-8 ring-1 ring-white">
          <h3 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> The Brief
          </h3>
          <p className="text-[15px] text-[#111113] font-medium leading-relaxed italic border-l-[3px] border-l-blue-200 pl-6">{data.the_brief}</p>
        </div>

        {/* Auto Caps */}
        {data.auto_caps_checked.some(c => c.fired) && (
          <div className="summary-card bg-orange-50/80 backdrop-blur-xl border border-orange-100 rounded-[2rem] p-8 shadow-sm mb-8">
            <h3 className="text-[11px] font-extrabold text-orange-700 uppercase tracking-widest mb-5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Automatic Caps Triggered
            </h3>
            <div className="space-y-3">
              {data.auto_caps_checked.filter(c => c.fired).map((cap, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/60 p-4 rounded-xl border border-orange-100/50">
                  <AlertOctagon className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <span className="text-[14px] text-orange-950 font-bold block mb-1">{cap.condition}</span>
                    <span className="text-[12px] font-extrabold text-orange-700 uppercase tracking-wider px-2.5 py-1 bg-orange-100 rounded-md inline-block">{cap.cap_applied}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12 Dimensions */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-black text-[#111113] tracking-tight">Dimensions Breakdown</h2>
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="text-[11px] font-extrabold text-[#111113] uppercase tracking-widest hover:text-amber-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-black/[0.04] no-print"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
          <div className="space-y-1">
            {data.dimensions.map((dim) => (
              <DimensionCard key={dim.id} dim={dim} forceOpen={expandAll} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
