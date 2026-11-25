import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: Weekly Renewal Notifications
// Triggered via scheduled cron (e.g. Monday 09:00 IST)

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID') ?? ''
const whatsappToken = Deno.env.get('WHATSAPP_TOKEN') ?? ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function sendText(to: string, text: string) {
  // Normalize phone number
  const phone = to.replace(/\D/g, '').replace(/^0/, '91').replace(/^(?!91)/, '91')

  await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  })
}

Deno.serve(async (_req) => {
  try {
    const { data: renewals, error } = await supabase
      .from('mv_renewal_pipeline')
      .select('*')
      .lte('days_until_expiry', 30)
      .gte('days_until_expiry', 0)

    if (error) {
      console.error('Error querying mv_renewal_pipeline:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0
    for (const r of renewals ?? []) {
      if (r.customer_phone) {
        await sendText(
          r.customer_phone,
          `Reminder: Your AMC contract *${r.contract_no}* expires on ${r.valid_to}. ` +
            `Please contact us to renew.`
        )
        sentCount++
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sentCount, total_renewals: renewals?.length ?? 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
