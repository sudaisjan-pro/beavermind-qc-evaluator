import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { evaluateTranscript } from '@/lib/evaluator';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabase = createServerSupabaseClient();

    // Fetch existing evaluation
    const { data: row, error: fetchError } = await supabase
      .from('evaluations')
      .select('id, transcript, call_type')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Reset status to processing
    await supabase
      .from('evaluations')
      .update({
        status: 'processing',
        error_message: null,
        score_data: null,
      })
      .eq('id', id);

    // Fire background evaluator
    (async () => {
      try {
        console.log(`[Retry] Retrying evaluation ${id}...`);
        const result = await evaluateTranscript(row.transcript, row.call_type);

        await supabase
          .from('evaluations')
          .update({
            status: 'completed',
            score_data: result,
            error_message: null,
          })
          .eq('id', id);

        console.log(`[Retry] Evaluation ${id} completed successfully.`);
      } catch (err) {
        const errorMsg = (err as Error).message || 'Unknown evaluation error';
        console.error(`[Retry] Evaluation ${id} failed:`, errorMsg);
        await supabase
          .from('evaluations')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', id);
      }
    })();

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
