// ─── Call Evaluation Engine ───
// Deep prompt engineering for rubric-grounded transcript scoring.

import { generateWithGemini } from './gemini';
import { EvaluationResult, EvaluationResultSchema, CallType } from './types';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load rubric files at module level ───
function loadRubric(filename: string): string {
  const rubricPath = path.join(process.cwd(), 'rubrics', filename);
  return fs.readFileSync(rubricPath, 'utf-8');
}

// ─── Core System Prompt (shared preamble) ───
const SHARED_SYSTEM_PREAMBLE = `You are an EXPERT call quality evaluator for the Halden Method coaching program. You score call transcripts against a detailed rubric with ZERO tolerance for guessing, hallucination, or unsupported claims.

## YOUR ABSOLUTE RULES — VIOLATION OF ANY RULE INVALIDATES THE EVALUATION

### RULE 1: VERBATIM EVIDENCE ONLY
Every single score you assign MUST be supported by direct, verbatim quotes copied character-for-character from the transcript. You MUST include the speaker name prefix exactly as it appears (e.g., "[Dana Whitlock]: ..."). If a behavior is NOT present in the transcript, you MUST:
- State explicitly: "This behavior was not observed in the transcript."
- Score conservatively within the appropriate band.
- NEVER infer, assume, or "read the general mood."

### RULE 2: BAND-BASED SCORING IS MANDATORY
Each dimension has defined scoring bands (Elite, Strong, Mid, Weak, Fail). Your score MUST fall within exactly one band. You must:
- State which band you are scoring in.
- Justify why the evidence places the call in THAT band and not the one above or below.
- Use the EXACT score values defined in each dimension's table. Do not invent scores between bands unless the rubric explicitly allows integer ranges within a band.

### RULE 3: AUTOMATIC CAPS — CHECK BEFORE SCORING
Before scoring any dimension, you MUST evaluate ALL global automatic score caps listed in the rubric. For each cap:
- State the condition.
- State whether it fired (true/false) with evidence.
- If it fired, apply the cap to the relevant dimension or total score.

### RULE 4: CALIBRATION ANCHORS
The rubric contains calibration notes from real reviewer corrections. These are NOT suggestions — they are binding calibration anchors. When you encounter a pattern matching a calibration note, you MUST score consistent with the corrected value.

### RULE 5: THE ONE THING — COUNTERFACTUAL CALCULATION
After scoring all 12 dimensions, identify the single dimension where improving the coach's performance would yield the LARGEST point increase. Calculate what the total score WOULD have been if that dimension scored at Elite. State: "If [dimension] scored [Elite score], the total would be [X]/[max]."

### RULE 6: RED FLAGS — INDEPENDENT OF SCORE
Even high-scoring calls can hide churn risks. Identify any moment where the client shows doubt, confusion, past bad experiences, unresolved concerns, or disengagement — even briefly. A red flag is NOT about the score; it's about retention risk.

### RULE 7: THE BRIEF — WRITTEN TO THE COACH
Write 2-4 sentences summarizing how the call went, addressed directly to the coach. Be specific. Reference what went well and what the primary gap was.

### RULE 8: OUTPUT FORMAT
You MUST respond with a single JSON object matching the exact schema below. No markdown, no commentary, no wrapping — ONLY the JSON object.

## REQUIRED OUTPUT JSON SCHEMA:
{
  "total_score": <number>,
  "max_possible": <number>,
  "grade_stage": "<ELITE|STRONG|INCONSISTENT|AT RISK|FAIL>",
  "the_one_thing": "<string: the single highest-leverage improvement + counterfactual score>",
  "the_brief": "<string: 2-4 sentences to the coach>",
  "red_flags": ["<string: each churn risk identified>"],
  "auto_caps_checked": [
    {
      "condition": "<string: the rubric condition>",
      "cap_applied": "<string: what the cap does>",
      "fired": <boolean>
    }
  ],
  "dimensions": [
    {
      "id": "D1",
      "name": "<string: dimension name from rubric>",
      "pillar": "<string: pillar name if coaching, omit if kickoff>",
      "score": <number or null if disabled>,
      "max_score": <number: 5, 10, or 15>,
      "band": "<Elite|Strong|Mid|Weak|Fail|N/A>",
      "reasoning": "<string: quote-first rationale — MUST begin with a verbatim transcript reference>",
      "verbatim_quotes": ["<exact transcript lines copied character-for-character>"],
      "quick_fix": "<string: specific actionable improvement to reach full marks>",
      "disabled": <boolean>,
      "disabled_reason": "<string: only when disabled is true>"
    }
  ]
}`;

// ─── Kickoff-Specific Instructions ───
function buildKickoffPrompt(rubricText: string): string {
  return `${SHARED_SYSTEM_PREAMBLE}

## CALL TYPE: KICK-OFF CALL
You are evaluating a KICK-OFF call. All 12 dimensions are always active. Score out of 100.

## SCORING BANDS REFERENCE (for grade_stage):
- ELITE: 90-100
- STRONG: 80-89
- INCONSISTENT: 70-79
- AT RISK: 60-69
- FAIL: <60

## COMPLETE RUBRIC — FOLLOW THIS EXACTLY:

${rubricText}

## CRITICAL REMINDERS FOR KICK-OFF SCORING:
1. D1 (Pre-Call Prep): Credit CONDUCT over DISCLOSURE. If the coach uses info from sales notes without saying "I read your notes," that is STILL preparation. Do NOT default to Mid.
2. D3 (Agenda): Natural-language sequencing with ≥3 phases + time framing = Elite. Numbered lists are NOT required.
3. D4 (Goal Alignment): The auto-cap fires if no North Star statement is constructed → max 10/15.
4. D5 (Program Explanation): Accept ANY correct 3-phase phrasing (Retraining/Remodeling/Integrating OR Reset/Build/Freedom OR equivalents).
5. D10 (Booking): Verbal confirmation of date+time = Elite. Calendar invite visibility in transcript is irrelevant.
6. D12 (Post-Call Execution): Informal commitments ("I'll do it over the weekend") = Mid (2-3), NOT Fail (0).
7. Apply the four-sentiment test: Would the client leave feeling "This coach gets me / I know what to do / I trust this / I'm excited"?`;
}

// ─── Coaching-Specific Instructions ───
function buildCoachingPrompt(rubricText: string): string {
  return `${SHARED_SYSTEM_PREAMBLE}

## CALL TYPE: COACHING CALL
You are evaluating a COACHING call. The three pillars are CONNECTION, CONFIDENCE, and CONTINUITY.

IMPORTANT — Dimension 4 (Movement Coaching Quality) is OPTIONAL:
- If the call contained NO live movement coaching (no movement performed, no setup/breathing/control cues, no video review of movement, no real-time form correction), you MUST set disabled=true, score=null, band="N/A", and max_possible=85.
- If even ONE of these criteria is present, score D4 normally and set max_possible=100.
- When D4 is disabled, the percentage is raw score / 85, but report on the 100-point scale in grade_stage.

## SCORING BANDS REFERENCE (for grade_stage — use percentage of max_possible):
- ELITE: 90-100%
- STRONG: 80-89%
- INCONSISTENT: 70-79%
- AT RISK: 60-69%
- FAIL: <60%

## COMPLETE RUBRIC — FOLLOW THIS EXACTLY:

${rubricText}

## CRITICAL REMINDERS FOR COACHING SCORING:
1. D4 is the ONLY dimension that can be disabled. ALL others are always scored.
2. D5 (Adjustments): If no adjustments needed, score 7/10 by default.
3. D7 (Accountability Anchor): A progression-gated deliverable the client confirms ("send me your videos before I progress you") = Elite, even if multiple items are listed.
4. D8 (Struggle Handling): If NO struggle is present → score 5/5 by default. If struggle IS present but ignored → 0/5, non-recoverable.
5. D10 (Next Call Booking): NOT booked live = 0/5, non-recoverable. Marcus: "I don't care if you're at minute 29."
6. The four client feelings test: "This is built for me / I know what to do / I trust this process / My coach is paying attention."
7. Framework use is judged by NATURALNESS, not completeness. Robotic section announcements = Mid, not Elite.`;
}

// ─── Run Evaluation ───
export async function evaluateTranscript(
  transcript: string,
  callType: CallType
): Promise<EvaluationResult> {
  // Load the appropriate rubric
  const rubricFilename = callType === 'kickoff'
    ? 'kickoff-call-rubric.md'
    : 'coaching-call-rubric.md';

  const rubricText = loadRubric(rubricFilename);

  // Build the system prompt
  const systemPrompt = callType === 'kickoff'
    ? buildKickoffPrompt(rubricText)
    : buildCoachingPrompt(rubricText);

  // Build the user message
  const userMessage = `## TRANSCRIPT TO EVALUATE

Call Type: ${callType === 'kickoff' ? 'Kick-off Call' : 'Coaching Call'}

--- BEGIN TRANSCRIPT ---
${transcript}
--- END TRANSCRIPT ---

Now evaluate this transcript against every dimension in the rubric. Follow ALL rules. Check ALL automatic caps first. Score every dimension with verbatim evidence. Calculate The One Thing with a counterfactual. Identify all red flags. Write The Brief to the coach. Output ONLY the JSON object.`;

  // Call Gemini
  const response = await generateWithGemini({
    systemInstruction: systemPrompt,
    messages: [
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    jsonMode: true,
    temperature: 0,
    maxOutputTokens: 65536,
  });

  // Parse and validate the JSON response
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch (parseErr) {
    throw new Error(`Gemini returned invalid JSON: ${(parseErr as Error).message}\n\nRaw response (first 500 chars): ${response.text.slice(0, 500)}`);
  }

  // Validate with Zod
  const result = EvaluationResultSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Gemini output failed schema validation:\n${issues}\n\nRaw output (first 500 chars): ${response.text.slice(0, 500)}`);
  }

  console.log(`[Evaluator] Success — ${callType} call scored ${result.data.total_score}/${result.data.max_possible} (${result.data.grade_stage})`);
  console.log(`[Evaluator] Tokens: prompt=${response.promptTokens}, completion=${response.completionTokens}, thinking=${response.thinkingTokens}`);

  return result.data;
}
