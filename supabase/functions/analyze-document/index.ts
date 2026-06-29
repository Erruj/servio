import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Niet ingelogd' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Ongeldig token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { documentId, fileName } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId is verplicht' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up the document and verify ownership; use the trusted file_path from DB,
    // never a client-supplied path.
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, user_id, file_path, file_name')
      .eq('id', documentId)
      .maybeSingle();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: 'Document niet gevonden' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (doc.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Geen toegang tot dit document' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const trustedPath: string = doc.file_path;
    const trustedName: string = fileName || doc.file_name || 'document';

    // Download the file from storage using the trusted path
    const { data: fileData, error: downloadError } = await supabase.storage.from('financial-documents').download(trustedPath);
    if (downloadError || !fileData) {
      await supabase.from('documents').update({ status: 'analysis_failed' }).eq('id', documentId);
      return new Response(JSON.stringify({ error: 'Bestand kon niet worden gedownload' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // Extract text based on file type
    let extractedText = '';
    const ext = (fileName || filePath).toLowerCase();
    
    if (ext.endsWith('.pdf')) {
      // For PDF: convert to base64 and use Gemini vision
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      const base64 = btoa(String.fromCharCode(...bytes));
      extractedText = await extractWithGeminiVision(base64, 'application/pdf', fileName);
    } else if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      // For images: use Gemini vision for OCR
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      const base64 = btoa(String.fromCharCode(...bytes));
      const mimeType = ext.endsWith('.png') ? 'image/png' : ext.endsWith('.gif') ? 'image/gif' : 'image/jpeg';
      extractedText = await extractWithGeminiVision(base64, mimeType, fileName);
    } else {
      // For text-based files, read as text
      extractedText = await fileData.text();
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Document: ${fileName || 'Onbekend'}. Geen tekst geëxtraheerd.`;
    }

    // Analyze with Gemini
    const analysis = await analyzeWithGemini(extractedText, fileName);

    // Update document in database
    await supabase.from('documents').update({
      status: 'analyzed',
      document_type: analysis.documentType || 'other',
      ai_summary: analysis.summary,
      ai_key_points: analysis.keyPoints,
      ai_risks: analysis.risks,
    }).eq('id', documentId);

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Analyze document error:', error);
    return new Response(JSON.stringify({ error: 'Document analyse mislukt. Probeer het opnieuw.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function extractWithGeminiVision(base64Content: string, mimeType: string, fileName: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Extraheer alle tekst uit dit document "${fileName}". Geef de volledige tekstinhoud terug, inclusief tabellen, bedragen, data, namen en alle andere relevante informatie. Als het een factuur of bon is, geef dan specifiek: factuurnummer, datum, bedrag, BTW, leverancier.` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Content}` } }
        ]
      }],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini vision error:', errText);
    throw new Error('OCR extraction failed');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzeWithGemini(text: string, fileName: string): Promise<{
  documentType: string;
  summary: string;
  keyPoints: string[];
  risks: string[];
  parties: string[];
  amounts: string[];
}> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{
        role: 'system',
        content: 'Je bent een zakelijke documentanalist. Analyseer documenten en geef gestructureerde informatie terug in JSON. Antwoord alleen in het Nederlands.'
      }, {
        role: 'user',
        content: `Analyseer de volgende documentinhoud van "${fileName}" en geef terug als JSON:
{
  "documentType": "contract" | "invoice" | "receipt" | "offer" | "other",
  "summary": "2-3 zinnen samenvatting",
  "keyPoints": ["punt 1", "punt 2", ...],
  "risks": ["risico 1", ...],
  "parties": ["partij 1", ...],
  "amounts": ["€100,00", ...]
}

Document inhoud:
${text.slice(0, 8000)}`
      }],
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) throw new Error('Analysis API failed');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    const parsed = JSON.parse(content);
    return {
      documentType: parsed.documentType || 'other',
      summary: parsed.summary || `Document "${fileName}" is geanalyseerd.`,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : ['Document verwerkt'],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      parties: Array.isArray(parsed.parties) ? parsed.parties : [],
      amounts: Array.isArray(parsed.amounts) ? parsed.amounts : [],
    };
  } catch {
    return {
      documentType: 'other',
      summary: content.slice(0, 500),
      keyPoints: ['Document is verwerkt door AI'],
      risks: [],
      parties: [],
      amounts: [],
    };
  }
}
