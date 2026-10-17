import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Provider-neutral inbound IVR adapter.
 * Accepts common webhook fields (speech/transcript/text/SpeechResult and Digits)
 * and hands the utterance to the existing Voice Mitra contract.
 * A telephony provider can translate this response to its own TTS/IVR format.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  let body: Record<string, unknown> = {};
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    form.forEach((value, key) => { body[key] = String(value); });
  } else {
    body = await request.json().catch(() => ({}));
  }

  const transcript = String(
    body.transcript ?? body.SpeechResult ?? body.speech ?? body.text ?? ''
  ).trim();
  const digits = String(body.Digits ?? body.digits ?? '').trim();

  if (!transcript && !digits) {
    return NextResponse.json({
      success: true,
      channel: 'ivr',
      action: 'speak_and_listen',
      prompt: 'आपको किस काम में मदद चाहिए? अपना काम बोलिए या विकल्प चुनिए।',
      input: { speech: true, dtmf: true }
    });
  }

  const utterance = transcript || `IVR option ${digits}`;
  const origin = new URL('/api/ai-mitra/voice', request.url);
  const result = await fetch(origin, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: utterance, transcript: utterance })
  });

  const payload = await result.json().catch(() => ({
    success: false,
    code: 'VOICE_INTENT_UNAVAILABLE'
  }));

  const domain = payload?.intent?.domain || null;
  const services = Array.isArray(payload?.services) ? payload.services : [];

  return NextResponse.json({
    success: Boolean(payload?.success),
    channel: 'ivr',
    intent: payload?.intent || { text: utterance, domain: null, confidence: 'needs_clarification' },
    services,
    action: domain ? 'continue_journey' : 'clarify',
    speech: domain
      ? `आपकी जरूरत ${domain} सेवा से संबंधित लग रही है। आगे बढ़ने के लिए सेवा चुनें या अपना काम फिर से बताएं।`
      : 'कृपया अपना काम थोड़ा और स्पष्ट बताइए।',
    input: { speech: true, dtmf: true },
    telephony: {
      adapter: 'provider-neutral',
      providerIntegrationRequired: true
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
