"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight } from "lucide-react";

const SAMPLE_TRANSCRIPTS = [
  { label: 'Kickoff 1', file: '/transcripts/kickoff-01.txt', type: 'kickoff' as const },
  { label: 'Kickoff 2', file: '/transcripts/kickoff-02.txt', type: 'kickoff' as const },
  { label: 'Coaching 1', file: '/transcripts/coaching-01.txt', type: 'coaching' as const },
  { label: 'Coaching 2', file: '/transcripts/coaching-02.txt', type: 'coaching' as const },
];

export default function HomePage() {
  const router = useRouter();
  const [callType, setCallType] = useState<"kickoff" | "coaching">("kickoff");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, call_type: callType }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create evaluation');
      }

      const { id } = await res.json();
      router.push(`/evaluations/${id}`);
    } catch (err: any) {
      alert("Error starting evaluation: " + err.message);
      setLoading(false);
    }
  };

  const loadSample = async (sample: typeof SAMPLE_TRANSCRIPTS[0]) => {
    setLoadingSample(sample.label);
    try {
      const res = await fetch(sample.file);
      const text = await res.text();
      setTranscript(text);
      setCallType(sample.type);
    } catch {
      alert('Failed to load sample transcript');
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#1A1A1E] relative overflow-hidden font-sans selection:bg-amber-200">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/50 blur-[140px] pointer-events-none" />

      <header className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111113] text-white flex items-center justify-center shadow-lg shadow-black/10">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">BeaverMind</h1>
            <p className="text-xs text-[#71717A] font-medium tracking-wide">QC EVALUATION ENGINE</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.04] shadow-xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-700">12-Dimension Model Active</span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-6 pb-20 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111113] mb-4">
            Coaching Call Quality Control
          </h2>
          <p className="text-[#6E6D7A] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Deterministic transcript grading against executive rubrics. Verbatim citations, churn risk detection, and automatic caps.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-2xl border border-black/[0.06] rounded-[2.5rem] p-8 md:p-10 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.06)] ring-1 ring-white"
        >
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-3">
              1. Select Call Architecture
            </label>
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-[#F4F1EA] rounded-2xl border border-black/[0.03]">
              <button
                type="button"
                onClick={() => setCallType("kickoff")}
                className={`py-3.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  callType === "kickoff"
                    ? "bg-white text-[#111113] shadow-[0_4px_12px_rgba(0,0,0,0.06)] scale-[1.01]"
                    : "text-[#71717A] hover:text-[#111113]"
                }`}
              >
                <span>🚀</span> Kick-off Call
              </button>
              <button
                type="button"
                onClick={() => setCallType("coaching")}
                className={`py-3.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  callType === "coaching"
                    ? "bg-white text-[#111113] shadow-[0_4px_12px_rgba(0,0,0,0.06)] scale-[1.01]"
                    : "text-[#71717A] hover:text-[#111113]"
                }`}
              >
                <span>🎯</span> Regular Coaching Call
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A]">
                2. Paste Verbatim Transcript
              </label>
              <div className="flex gap-2">
                {SAMPLE_TRANSCRIPTS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => loadSample(sample)}
                    disabled={!!loadingSample}
                    className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50 uppercase tracking-wider"
                  >
                    {loadingSample === sample.label ? '...' : sample.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={8}
              required
              placeholder="Paste raw conversation transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-black/[0.08] focus:border-[#111113] focus:bg-white rounded-2xl p-5 text-sm font-mono leading-relaxed transition-all outline-none resize-y"
            />
            <div className="mt-2 text-right">
              <span className="text-xs font-medium text-[#A1A1AA]">{transcript.length} characters</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !transcript.trim()}
            className="w-full bg-[#111113] hover:bg-[#27272A] text-white font-bold text-sm tracking-wide py-4 rounded-2xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingesting Transcript...
              </span>
            ) : (
              <>
                <span>Run Executive Evaluation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
