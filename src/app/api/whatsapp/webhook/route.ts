import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendText } from '@/lib/whatsapp';

// GET: Meta verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Meta X-Hub-Signature-256 if WHATSAPP_APP_SECRET is set
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const signature = req.headers.get('x-hub-signature-256');

    if (appSecret && signature) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')}`;

      if (signature !== expectedSignature) {
        console.warn('WhatsApp webhook signature verification failed.');
        return new NextResponse('Invalid signature', { status: 403 });
      }
    }

    const body = JSON.parse(rawBody || '{}');
    const supabase = createAdminClient(); // Service role client to bypass RLS for webhook creation

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message || message.type !== 'text') {
      return NextResponse.json({ ok: true });
    }

    const from = message.from; // Sender's WhatsApp phone number
    const text = message.text?.body?.trim();

    if (!text) {
      return NextResponse.json({ ok: true });
    }

    // Limit incoming text length to avoid denial of service or payload bloat
    const sanitizedText = text.slice(0, 2000);

    // Match phone number by last 10 digits
    const cleanDigits = from.replace(/\D/g, '');
    const phoneSearch = cleanDigits.slice(-10);

    const { data: party, error: partyErr } = await supabase
      .from('party')
      .select('party_id, org_id, name')
      .ilike('phone', `%${phoneSearch}%`)
      .limit(1)
      .maybeSingle();

    if (partyErr) {
      console.error('Error finding party by phone:', partyErr);
    }

    if (!party) {
      await sendText(
        from,
        "Hello! We don't have your number registered. Please contact us directly."
      );
      return NextResponse.json({ ok: true });
    }

    // Get the first site for this party
    const { data: site } = await supabase
      .from('site')
      .select('site_id')
      .eq('party_id', party.party_id)
      .limit(1)
      .maybeSingle();

    // Generate fallback tokens if DB trigger is absent
    const generatedToken = crypto.randomUUID();
    const fallbackTicketNo = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    // Create a ticket from the WhatsApp message
    const { data: ticket, error: ticketErr } = await supabase
      .from('ticket')
      .insert({
        org_id: party.org_id,
        site_id: site?.site_id || null,
        source: 'whatsapp',
        fault_description: sanitizedText,
        priority: 'P2',
        ticket_no: fallbackTicketNo,
        public_token: generatedToken,
      })
      .select('ticket_no, public_token')
      .single();

    if (ticketErr || !ticket) {
      console.error('Error creating ticket from WhatsApp webhook:', ticketErr);
      await sendText(
        from,
        "We received your message, but encountered an error registering the ticket. Please try again shortly."
      );
      return NextResponse.json({ ok: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://serviceiq.vercel.app';

    await sendText(
      from,
      `Hi ${party.name}! Your complaint has been registered as *${ticket.ticket_no}*. ` +
        `We will assign a technician shortly. ` +
        `Track your ticket at: ${appUrl}/portal/${ticket.public_token}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    return NextResponse.json({ ok: true }); // Always 200 OK to Meta
  }
}
