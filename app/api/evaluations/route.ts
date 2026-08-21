import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { evaluateTranscript } from '@/lib/evaluator';
import { CreateEvaluationRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateEvaluationRequest = await request.json();

    // Validate input
    if (!body.transcript || !body.transcript.trim()) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }
    if (!body.call_type || !['kickoff', 'coaching'].includes(body.call_type)) {
      return NextResponse.json(
        { error: 'call_type must be "kickoff" or "coaching"' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Insert a new evaluation row with status 'processing'
    const { data: row, error: insertError } = await supabase
      .from('evaluations')
      .insert({
        call_type: body.call_type,
        transcript: body.transcript,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError || !row) {
      console.error('[API] Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create evaluation: ' + (insertError?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const evaluationId = row.id;
    console.log(`[API] Created evaluation ${evaluationId} (${body.call_type}), starting background processing...`);

    // Fire-and-forget: run the evaluation in the background.
    // This is the key architectural decision — the response returns immediately
    // with the ID, and the evaluation runs async. The user can close the tab.
    // Note: In Next.js serverless, we use waitUntil-style patterns.
    // For the exercise, we use a detached promise that writes results back to Supabase.
    runEvaluationInBackground(evaluationId, body.transcript, body.call_type);

    return NextResponse.json({ id: evaluationId }, { status: 201 });

  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error: ' + (err as Error).message },
      { status: 500 }
    );
  }
}

// ─── Background Evaluation Runner ───
// Runs detached from the HTTP response lifecycle.
function runEvaluationInBackground(
  evaluationId: string,
  transcript: string,
  callType: 'kickoff' | 'coaching'
) {
  // Detached async — does not block the response
  (async () => {
    const supabase = createServerSupabaseClient();

    try {
      console.log(`[Background] Starting evaluation ${evaluationId}...`);

      const result = await evaluateTranscript(transcript, callType);

      // Write the successful result back to Supabase
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          status: 'completed',
          score_data: result,
          error_message: null,
        })
        .eq('id', evaluationId);

      if (updateError) {
        console.error(`[Background] Failed to update evaluation ${evaluationId}:`, updateError);
        await supabase
          .from('evaluations')
          .update({
            status: 'failed',
            error_message: 'Failed to save results: ' + updateError.message,
          })
          .eq('id', evaluationId);
      } else {
        console.log(`[Background] Evaluation ${evaluationId} completed successfully.`);
      }

    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown evaluation error';
      console.error(`[Background] Evaluation ${evaluationId} failed:`, errorMessage);

      // Write the error back to Supabase so the UI can display it
      try {
        await supabase
          .from('evaluations')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', evaluationId);
      } catch (updateErr) {
        console.error(`[Background] Failed to write error for ${evaluationId}:`, updateErr);
      }
    }
  })();
}
