// Tijdelijke testfunctie: controleert of de Resend API-key en het verzenddomein werken.
// Wordt na verificatie verwijderd.
Deno.serve(async () => {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'RESEND_API_KEY ontbreekt' }), { status: 500 })

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${key}` },
  })
  const body = await res.text()
  return new Response(JSON.stringify({ status: res.status, body }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
