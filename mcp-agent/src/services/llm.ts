/**
 * LLM service for generating summaries from transcripts
 * Supports OpenAI and Anthropic (configurable via env vars)
 */

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'anthropic'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4';

export interface SummaryResult {
  summary_text: string;
  key_points: string[];
  action_items: any[];
}

export async function generateSummary(
  transcript: any,
  model: string = LLM_MODEL
): Promise<SummaryResult> {
  const transcriptText = typeof transcript === 'string' 
    ? transcript 
    : JSON.stringify(transcript, null, 2);

  const prompt = `You are analyzing a transcript from a knowledge capture session. Generate a comprehensive summary with the following structure:

1. Summary Text: A 2-3 paragraph summary of the conversation
2. Key Points: A bulleted list of 5-10 key insights or topics discussed
3. Action Items: A list of any action items, next steps, or follow-ups mentioned

Transcript:
${transcriptText}

Respond with valid JSON in this exact format:
{
  "summary_text": "...",
  "key_points": ["...", "..."],
  "action_items": [{...}, {...}]
}`;

  if (LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
    return generateSummaryAnthropic(prompt, model);
  } else if (OPENAI_API_KEY) {
    return generateSummaryOpenAI(prompt, model);
  } else {
    throw new Error('No LLM API key configured');
  }
}

async function generateSummaryOpenAI(prompt: string, model: string): Promise<SummaryResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates structured summaries from transcripts.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  
  return {
    summary_text: content.summary_text || '',
    key_points: content.key_points || [],
    action_items: content.action_items || [],
  };
}

async function generateSummaryAnthropic(prompt: string, model: string): Promise<SummaryResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const contentText = data.content[0].text;
  const content = JSON.parse(contentText);
  
  return {
    summary_text: content.summary_text || '',
    key_points: content.key_points || [],
    action_items: content.action_items || [],
  };
}
