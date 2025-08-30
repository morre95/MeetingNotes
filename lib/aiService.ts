import Constants from 'expo-constants';

export interface TranscriptionResult {
  transcript: string;
  summary: string;
  action_items: string[];
}

interface InputAudio {
  base64: string;
  filename: string;
  title: string;
}

// Choose AI services: 
// - Transcription: OpenAI Whisper (v1/audio/transcriptions) is high quality and robust for meetings.
// - Summarization: OpenAI GPT-4o-mini is cost-effective and good for long context summaries.
// You can swap to AssemblyAI or Google STT by editing this single file.

export async function transcribeAndSummarize(input: InputAudio): Promise<TranscriptionResult> {
  const openaiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY || Constants.default.expoConfig?.extra?.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY saknas i app.json -> expo.extra');
  }

  // 1) Transcription with Whisper
  const transcript = await transcribeWithWhisper({ openaiKey, base64: input.base64, filename: input.filename });

  // 2) Summarize with GPT
  const { summary, action_items } = await summarizeWithGPT({ openaiKey, title: input.title, transcript });

  return { transcript, summary, action_items };
}

async function transcribeWithWhisper({ openaiKey, base64, filename }: { openaiKey: string; base64: string; filename: string; }): Promise<string> {
  const formData = new FormData();
  // Construct a Blob-like object. On mobile, fetch can send base64 using data URI.
  // We use a small trick to convert base64 to a binary blob via atob is not available; rely on data URI.
  // Expo fetch supports multipart with { uri, name, type }.
  const uri = `data:audio/m4a;base64,${base64}`;
  formData.append('file', { uri, name: filename, type: 'audio/m4a' } as any);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData as any,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Transcription failed: ' + txt);
  }
  const text = await res.text();
  return text.trim();
}

async function summarizeWithGPT({ openaiKey, title, transcript }: { openaiKey: string; title: string; transcript: string; }): Promise<{ summary: string; action_items: string[] }> {
  const prompt = `Du är en expert på mötesanteckningar. Sammanfatta mötet kortfattat (5-8 meningar), lista tydliga åtgärdspunkter med ägare om möjligt, och viktiga beslut. Svara på svenska.

Titel: ${title}
Transkript:
${transcript}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Du är en hjälpsam assistent som skapar mötesanteckningar.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Summarization failed: ' + txt);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || '';

  // naive parse: split action items if a list is present
  const action_items: string[] = [];
  const lines = content.split(/\r?\n/);
  let summaryLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-•*]\s/.test(trimmed)) {
      action_items.push(trimmed.replace(/^[-•*]\s/, ''));
    } else {
      summaryLines.push(trimmed);
    }
  }
  const summary = summaryLines.join(' ').replace(/\s+/g, ' ').trim();
  return { summary: summary || content, action_items };
}
