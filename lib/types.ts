import { z } from 'zod';

// ─── Call Type ───
export type CallType = 'kickoff' | 'coaching';

// ─── Dimension Score Schema ───
export const DimensionSchema = z.object({
  id: z.string(),                           // "D1", "D2", ..., "D12"
  name: z.string(),                          // "Pre-Call Preparation", etc.
  pillar: z.string().nullable().optional(),   // coaching only: "CONNECTION", "VALUE", etc.
  score: z.number().nullable(),              // null when disabled (coaching D4)
  max_score: z.number(),                     // 5, 10, or 15
  band: z.string(),                          // "Elite", "Strong", "Mid", "Weak", "Fail", "N/A"
  reasoning: z.string(),                     // quote-first rationale
  verbatim_quotes: z.array(z.string()),      // exact transcript lines used as evidence
  quick_fix: z.string(),                     // actionable coaching improvement
  disabled: z.boolean().default(false),      // true only for coaching D4 when no movement coaching
  disabled_reason: z.string().nullable().optional(),  // why D4 was disabled
});

export type Dimension = z.infer<typeof DimensionSchema>;

// ─── Automatic Cap Schema ───
export const AutoCapSchema = z.object({
  condition: z.string(),       // the rubric condition that fired
  cap_applied: z.string(),     // e.g. "Max 70 total", "0/5 on D10"
  fired: z.boolean(),
});

export type AutoCap = z.infer<typeof AutoCapSchema>;

// ─── Full Evaluation Result Schema ───
export const EvaluationResultSchema = z.object({
  total_score: z.number(),
  max_possible: z.number(),         // 100 normally, 85 when coaching D4 disabled
  grade_stage: z.string(),          // "ELITE", "STRONG", "INCONSISTENT", "AT RISK", "FAIL"
  the_one_thing: z.string(),        // single highest-leverage improvement + counterfactual
  the_brief: z.string(),            // few sentences on how the call went, written to the coach
  red_flags: z.array(z.string()),   // churn risks, even on high-scoring calls
  auto_caps_checked: z.array(AutoCapSchema),
  dimensions: z.array(DimensionSchema),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// ─── Evaluation Status ───
export type EvaluationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Database Row ───
export interface EvaluationRow {
  id: string;
  call_type: CallType;
  transcript: string;
  status: EvaluationStatus;
  error_message: string | null;
  score_data: EvaluationResult | null;
  created_at: string;
  updated_at: string;
}

// ─── API Request/Response Types ───
export interface CreateEvaluationRequest {
  transcript: string;
  call_type: CallType;
}

export interface CreateEvaluationResponse {
  id: string;
}

export interface GetEvaluationResponse {
  id: string;
  status: EvaluationStatus;
  call_type: CallType;
  error_message: string | null;
  score_data: EvaluationResult | null;
  created_at: string;
  updated_at: string;
}

// ─── Grade Band Helper ───
export function getGradeStage(score: number, maxPossible: number): string {
  const pct = (score / maxPossible) * 100;
  if (pct >= 90) return 'ELITE';
  if (pct >= 80) return 'STRONG';
  if (pct >= 70) return 'INCONSISTENT';
  if (pct >= 60) return 'AT RISK';
  return 'FAIL';
}
