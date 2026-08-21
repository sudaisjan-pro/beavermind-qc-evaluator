import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GetEvaluationResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Evaluation ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: row, error } = await supabase
      .from('evaluations')
      .select('id, status, call_type, error_message, score_data, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    const response: GetEvaluationResponse = {
      id: row.id,
      status: row.status,
      call_type: row.call_type,
      error_message: row.error_message,
      score_data: row.score_data,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error('[API] GET evaluation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
