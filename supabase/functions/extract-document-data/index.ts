import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function detectMime(path: string, fallback?: string): string {
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function fetchAsBase64(url: string): Promise<{ base64: string; mime: string }> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Kon bestand niet ophalen: ${resp.status}`);
  const contentType = resp.headers.get('content-type') || '';
  const buf = new Uint8Array(await resp.arrayBuffer());
  // Convert to base64 in chunks to avoid call-stack issues
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);
  return { base64, mime: contentType };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    let { file_url, file_path, type, bucket } = body || {};
    const docType: 'receipt' | 'invoice' = type === 'invoice' ? 'invoice' : 'receipt';
    const bucketName = bucket || 'financial-documents';

    // If file_path given, mint a signed URL server-side
    if (!file_url && file_path) {
      const { data: signed, error: signErr } = await supabase
        .storage.from(bucketName).createSignedUrl(file_path, 600);
      if (signErr || !signed?.signedUrl) {
        throw new Error('Kon signed URL niet aanmaken');
      }
      file_url = signed.signedUrl;
    }
    if (!file_url) throw new Error('file_url of file_path is verplicht');

    const { base64, mime: fetchedMime } = await fetchAsBase64(file_url);
    const mime = detectMime(file_path || file_url, fetchedMime);
    const dataUrl = `data:${mime};base64,${base64}`;

    const promptText = docType === 'invoice'
      ? 'Extraheer de volgende data uit deze factuur en geef ALLEEN raw JSON terug zonder markdown, zonder code blocks, zonder uitleg: { "vendor_name": string, "date": "YYYY-MM-DD" of null, "due_date": "YYYY-MM-DD" of null, "invoice_number": string of null, "total_amount": number, "vat_amount": number, "description": string, "currency": "EUR"|"USD"|... }. Gebruik null als een veld niet duidelijk leesbaar is. Bedragen altijd als getal (geen valuta symbool).'
      : 'Extraheer de volgende data uit dit bonnetje en geef ALLEEN raw JSON terug zonder markdown, zonder code blocks, zonder uitleg: { "vendor_name": string, "date": "YYYY-MM-DD" of null, "total_amount": number, "vat_amount": number, "description": string, "currency": "EUR"|"USD"|... }. Gebruik null als een veld niet duidelijk leesbaar is. Bedragen altijd als getal (geen valuta symbool).';

    // Build multimodal content: PDFs use file block, images use image_url
    const userContent: any[] = [{ type: 'text', text: promptText }];
    if (mime === 'application/pdf') {
      userContent.push({
        type: 'file',
        file: {
          filename: (file_path || 'document').split('/').pop() || 'document.pdf',
          file_data: dataUrl,
        },
      });
    } else {
      userContent.push({ type: 'image_url', image_url: { url: dataUrl } });
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: 'Je bent een OCR/data-extractie assistent. Antwoord uitsluitend met geldige JSON.' },
          { role: 'user', content: userContent },
        ],
        max_completion_tokens: 800,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('extract-document-data: AI error', aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Te veel verzoeken. Probeer het zo opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits zijn op.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI Gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    let extracted: Record<string, unknown> = {};
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Try to find JSON object inside the text
      const match = cleaned.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(match ? match[0] : cleaned);
    } catch (e) {
      console.warn('extract-document-data: failed to parse JSON, returning raw');
      extracted = { raw: content };
    }

    return new Response(
      JSON.stringify({ success: true, type: docType, data: extracted, model: 'openai/gpt-5' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('extract-document-data error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
