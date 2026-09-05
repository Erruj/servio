// Tijdelijke testfunctie: verstuurt één testmail via Resend om domein + key te verifiëren.
// Wordt na verificatie verwijderd.
Deno.serve(async () => {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'RESEND_API_KEY ontbreekt' }), { status: 500 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Servio <noreply@notify.getservio.co>',
      to: ['info@getservio.co'],
      reply_to: 'info@getservio.co',
      subject: 'Servio testmail (verzendcontrole)',
      text: 'Dit is een technische testmail om te controleren of Servio-mails aankomen.',
    }),
  })
  const body = await res.text()
  return new Response(JSON.stringify({ status: res.status, body }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
