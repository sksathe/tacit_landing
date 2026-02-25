import { config } from 'dotenv';

// Ensure env is loaded when this module is imported directly (mostly redundant with index.ts but safe)
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY is not set. Summary generation will fail until it is configured in server-api/.env');
}

export interface GeneratedSummary {
  model: string;
  summary_text: string;
  key_points: string[];
  action_items: string[];
}

export interface SummaryGenerationOptions {
  tone?: string;
  audience?: string;
  instructions?: string;
}

export interface ClarityDimension {
  id: string;
  label: string;
  emoji: string;
  score: number;
  /** 1–3 short bullets explaining strengths. */
  whyHigh: string[];
  /** 1–3 short bullets explaining weaknesses. */
  whyLow: string[];
}

export interface ClarityScoreResult {
  model: string;
  title: string;
  dimensions: ClarityDimension[];
  overallScore: number;
  overallLabel: string;
  /** 2–5 short bullets that synthesize the clarity story. */
  interpretation: string[];
}

export interface ClarityScoreOptions {
  /**
   * Optional free-form steering instructions from the caller.
   * This can nudge style or emphasis but must never override grounding rules.
   */
  instructions?: string;
}

/**
 * Generate a summary from a transcript JSON using OpenAI.
 * The transcript is passed as JSON; the model returns a structured JSON object.
 * Optional options (tone, audience, instructions) let the caller steer the style.
 */
export async function generateSummaryFromTranscriptRaw(
  rawTranscript: any,
  options?: SummaryGenerationOptions
): Promise<GeneratedSummary> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured for the server API');
  }

  const tone = options?.tone?.trim();
  const audience = options?.audience?.trim();
  const extraInstructions = options?.instructions?.trim();

  const toneLine = tone ? `Use a ${tone} tone.\n` : '';
  const audienceLine = audience ? `Write for this audience: ${audience}.\n` : '';
  const extraLine = extraInstructions ? `Additional instructions from the user: ${extraInstructions}\n` : '';

  const prompt = `You are a senior note-taker and knowledge curator.
You will receive a transcript of a knowledge capture call as JSON.

Your job is to:
- Write a concise executive summary (3-6 sentences).
- Extract 3-10 key points (short bullet-style items).
- Extract 0-10 action items, each with a short description.

CRITICAL CONSTRAINTS:
- You must only use information that is explicitly present in the transcript JSON.
- Do NOT invent or infer new facts, numbers, names, dates, companies, or metrics.
- If the transcript does not specify something, say that it is \"not specified in the transcript\" instead of guessing.
- Do NOT bring in any outside knowledge or assumptions beyond what the transcript says.
- Paraphrasing is allowed, but all content must be grounded in the transcript.

Styling hints (optional; follow only if consistent with the transcript):
${toneLine}${audienceLine}${extraLine}

Return ONLY a JSON object with this shape:
{
  "summary_text": string,
  "key_points": string[],
  "action_items": string[]
}

Do not include any additional keys or commentary.`;

  const body = {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `Here is the transcript JSON:\n\n${JSON.stringify(rawTranscript, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' as const },
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI API error (${response.status}): ${text || response.statusText}`);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no content for summary');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error('Failed to parse OpenAI summary JSON');
  }

  return {
    model: LLM_MODEL,
    summary_text: String(parsed.summary_text ?? ''),
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points.map(String) : [],
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items.map(String) : [],
  };
}

/**
 * Generate a "Clarity Scorer" style report from a transcript JSON using
 * the same OpenAI model as summaries.
 *
 * This is intentionally fancy and presentation-ready: it uses emojis,
 * headings, scored dimensions, and short narrative interpretation.
 *
 * CRITICAL: The model must rely ONLY on what is explicitly present
 * in the transcript JSON – no external facts or speculation.
 */
export async function generateClarityScoreFromTranscriptRaw(
  rawTranscript: any,
  options?: ClarityScoreOptions
): Promise<ClarityScoreResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured for the server API');
  }

  const extraInstructions = options?.instructions?.trim();

  const extraLine = extraInstructions
    ? `Additional optional steering from the user (do NOT override grounding rules): ${extraInstructions}\n`
    : '';

  const prompt = `You are an expert facilitator evaluating how clearly a conversation communicates its ideas.
You will receive the transcript of a call as JSON. You are not judging the *quality* of the ideas,
only how clearly they are articulated in the transcript itself.

You must analyze clarity strictly based on what is explicitly present in the transcript. If something
important is missing or vague in the transcript, call that out as a clarity weakness.

You are generating data for a UI that will show **cards** for each clarity dimension with:
- A label and emoji.
- A 0–100 score.
- 1–3 very short bullet points for "why high" and 1–3 very short bullet points for "why low".

You MUST return a single JSON object with this exact shape:
{
  "title": string,
  "dimensions": [
    {
      "id": string,              // e.g., "operational_clarity"
      "label": string,           // e.g., "Operational Clarity"
      "emoji": string,           // e.g., "1️⃣"
      "score": number,           // integer 0–100
      "whyHigh": string[],       // 1–3 SHORT bullets (<= 120 chars each) for strengths
      "whyLow": string[]         // 1–3 SHORT bullets (<= 120 chars each) for weaknesses
    },
    ...
  ],
  "overallScore": number,       // integer 0–100
  "overallLabel": string,       // short phrase, e.g., "Strong operational clarity, weaker governance detail"
  "interpretation": string[]    // 2–5 SHORT bullets (<= 160 chars each) synthesizing the clarity picture
}

Content rules:
- Use 2–3 dimensions. Good defaults:
  - Operational Clarity
  - Governance / Control Clarity
  - (Optional) Communication Hygiene or Stakeholder Alignment
- Scores must be integers between 0 and 100 (no decimals).
- Every bullet MUST be grounded in specific evidence from the transcript:
  - Reference things like "explicitly defines X", "never specifies Y", "declines to describe Z".
- Be **strictly grounded in the transcript JSON**. Do NOT invent or assume policies, metrics,
  regulations, or governance structures that are not described in the transcript.
- Do NOT mention that you are an AI model, JSON, or your own process.
- If something is unclear or not specified, say so directly (e.g., "Override paths are not described
  anywhere in the transcript.").
- Keep bullets compact and skimmable; avoid long paragraphs.

${extraLine}
Return ONLY the JSON object, with no markdown, no code fences, and no extra commentary.`;

  const body = {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `Here is the transcript JSON:\n\n${JSON.stringify(rawTranscript, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' as const },
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI API error (${response.status}) while generating clarity score: ${text || response.statusText}`);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI returned no content for clarity score');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Failed to parse OpenAI clarity score JSON');
  }

  const dimensions: ClarityDimension[] = Array.isArray(parsed.dimensions)
    ? parsed.dimensions.map((d: any, index: number) => ({
        id: String(d?.id ?? `dimension_${index + 1}`),
        label: String(d?.label ?? ''),
        emoji: String(d?.emoji ?? ''),
        score: typeof d?.score === 'number' ? d.score : Number(d?.score ?? 0),
        whyHigh: Array.isArray(d?.whyHigh) ? d.whyHigh.map((x: any) => String(x)) : [],
        whyLow: Array.isArray(d?.whyLow) ? d.whyLow.map((x: any) => String(x)) : [],
      }))
    : [];

  const interpretation: string[] = Array.isArray(parsed.interpretation)
    ? parsed.interpretation.map((x: any) => String(x))
    : [];

  return {
    model: LLM_MODEL,
    title: String(parsed.title ?? 'Clarity Score (Based Strictly on Transcript)'),
    dimensions,
    overallScore: typeof parsed.overallScore === 'number'
      ? parsed.overallScore
      : Number(parsed.overallScore ?? 0),
    overallLabel: String(parsed.overallLabel ?? ''),
    interpretation,
  };
}

