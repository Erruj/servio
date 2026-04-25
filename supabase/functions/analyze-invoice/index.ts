import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Category = 'software' | 'marketing' | 'office' | 'travel' | 'utilities' | 'salary' | 'other';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Niet ingelogd' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, anonKey);

    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return json({ error: 'Ongeldig token' }, 401);

    const { invoiceId, filePath } = await req.json();
    if (!invoiceId || !filePath) return json({ error: 'invoiceId en filePath zijn verplicht' }, 400);

    // Verify ownership
    const { data: invRow } = await supabase.from('invoices').select('user_id').eq('id', invoiceId).maybeSingle();
    if (!invRow || invRow.user_id !== user.id) return json({ error: 'Geen toegang' }, 403);

    // Download file
    const { data: fileData, error: dlError } = await supabase.storage.from('financial-documents').download(filePath);
    if (dlError || !fileData) {
      await supabase.from('invoices').update({ status: 'analysis_failed' }).eq('id', invoiceId);
      return json({ error: 'Bestand kon niet worden gedownload' }, 500);
    }

    const ext = filePath.toLowerCase();
    let mimeType = 'application/pdf';
    if (ext.endsWith('.png')) mimeType = 'image/png';
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (ext.endsWith('.gif')) mimeType = 'image/gif';
    else if (ext.endsWith('.webp')) mimeType = 'image/webp';

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    // Chunked base64 to avoid stack overflow
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any);
    }
    const base64 = btoa(binary);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI niet geconfigureerd' }, 500);

    const systemPrompt = `Je bent een expert in het analyseren van Nederlandse en Europese facturen. Je extraheert PRECIES de juiste financiële gegevens.

KRITIEKE REGELS VOOR HET BEDRAG:
- Het "amount" veld MOET het EINDTOTAAL zijn (totaal inclusief BTW, het bedrag dat de klant moet betalen)
- Zoek naar termen zoals: "Totaal", "Totaalbedrag", "Te betalen", "Totaal incl. BTW", "Total", "Grand Total", "Amount Due"
- NOOIT het subtotaal, een tussensom, een regelbedrag of het BTW-bedrag als "amount" gebruiken
- Als er meerdere bedragen zijn, kies ALTIJD het hoogste totaal dat als eindbedrag is gemarkeerd
- "vat_amount" is het APARTE BTW-bedrag (bijv. "BTW 21%: €4,64"), NIET het totaal
- Gebruik decimalen met punt, geen duizendtalscheidingstekens (bijv. 26.75 niet 26,75 of 1.234,56)
- Bij Nederlandse facturen wordt komma als decimaal gebruikt; converteer naar punt

CATEGORISERING op basis van leverancier en omschrijving:
- "software": Microsoft, Adobe, Google Workspace, Slack, Notion, hosting, SaaS, abonnementen voor digitale tools
- "marketing": Google Ads, Meta/Facebook Ads, LinkedIn Ads, Mailchimp, reclamebureaus, SEO, content
- "office": kantoorartikelen, papier, printer, meubels, koffie, schoonmaak
- "travel": NS, treinkaartjes, vliegtickets, hotels, taxi, Uber, brandstof, parkeren
- "utilities": KPN, Ziggo, T-Mobile, Vodafone, energie, water, internet, telefoon, gas
- "salary": loon, salaris, freelancer betalingen, payroll
- "other": alles wat niet duidelijk in bovenstaande past

Antwoord ALLEEN met geldige JSON, geen markdown.`;

    const userPrompt = `Analyseer deze factuur en geef een JSON object terug met EXACT deze structuur:
{
  "supplier": "naam van de leverancier/afzender",
  "invoice_number": "factuurnummer of null",
  "invoice_date": "YYYY-MM-DD of null",
  "due_date": "YYYY-MM-DD vervaldatum of null",
  "amount": <EINDTOTAAL inclusief BTW als nummer>,
  "vat_amount": <BTW-bedrag als nummer of null>,
  "category": "software" | "marketing" | "office" | "travel" | "utilities" | "salary" | "other",
  "ai_summary": "korte samenvatting van waar deze factuur over gaat (1 zin)"
}

Lees de factuur zorgvuldig. Het "amount" MOET het bedrag zijn dat de klant uiteindelijk moet betalen, dus het eindtotaal inclusief BTW.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI error', aiResp.status, t);
      await supabase.from('invoices').update({ status: 'analysis_failed' }).eq('id', invoiceId);
      if (aiResp.status === 429) return json({ error: 'Rate limit, probeer later opnieuw' }, 429);
      if (aiResp.status === 402) return json({ error: 'AI credits op' }, 402);
      return json({ error: 'AI analyse mislukt' }, 500);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const validCats: Category[] = ['software', 'marketing', 'office', 'travel', 'utilities', 'salary', 'other'];
    const category = validCats.includes(parsed.category) ? parsed.category : 'other';

    const num = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const update: Record<string, any> = {
      supplier: parsed.supplier || null,
      invoice_number: parsed.invoice_number || null,
      invoice_date: parsed.invoice_date || null,
      due_date: parsed.due_date || null,
      amount: num(parsed.amount),
      vat_amount: num(parsed.vat_amount),
      category,
      ai_summary: parsed.ai_summary || null,
      status: 'pending',
    };

    const { error: upErr } = await supabase.from('invoices').update(update).eq('id', invoiceId);
    if (upErr) {
      console.error('Update error', upErr);
      return json({ error: 'Opslaan mislukt' }, 500);
    }

    return json({ success: true, data: update });
  } catch (e) {
    console.error('analyze-invoice error', e);
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
