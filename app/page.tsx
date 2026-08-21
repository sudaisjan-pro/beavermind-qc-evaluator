'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SAMPLE_TRANSCRIPTS = [
  { label: 'Kickoff 1', file: '/transcripts/kickoff-01.txt', type: 'kickoff' as const },
  { label: 'Kickoff 2', file: '/transcripts/kickoff-02.txt', type: 'kickoff' as const },
  { label: 'Coaching 1', file: '/transcripts/coaching-01.txt', type: 'coaching' as const },
  { label: 'Coaching 2', file: '/transcripts/coaching-02.txt', type: 'coaching' as const },
];

export default function HomePage() {
  const [transcript, setTranscript] = useState('');
  const [callType, setCallType] = useState<'kickoff' | 'coaching'>('kickoff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const router = useRouter();

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setIsSubmitting(true);
    setError(null);

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
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
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
      setError('Failed to load sample transcript');
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-3xl w-full">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Call Evaluator</h1>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Paste a coaching transcript below. Our AI scores it against the full 12-dimension rubric with verbatim evidence.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

            {/* Call Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Call Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCallType('kickoff')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                    callType === 'kickoff'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  🚀 Kick-off Call
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('coaching')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                    callType === 'coaching'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  🎯 Coaching Call
                </button>
              </div>
            </div>

            {/* Transcript Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transcript</label>
                <span className="text-xs text-slate-400">
                  {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="[Speaker Name]: what they said..."
                className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none font-mono text-sm text-slate-800 placeholder:text-slate-300 transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Quick Load Samples */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Quick load:</span>
              {SAMPLE_TRANSCRIPTS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => loadSample(sample)}
                  disabled={!!loadingSample}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingSample === sample.label ? '...' : sample.label}
                </button>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !transcript.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting Evaluation...
                </>
              ) : (
                <>Generate Report</>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Evaluations run in the background — you can safely close this tab and return later.
        </p>
      </div>
    </main>
  );
}
