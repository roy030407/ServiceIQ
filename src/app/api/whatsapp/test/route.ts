import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // Check if credentials are still placeholder
    if (!token || token === 'your-whatsapp-permanent-token' || !phoneId || phoneId === 'your-whatsapp-phone-id') {
      return NextResponse.json({
        success: false,
        reason: 'CREDENTIALS_MISSING',
        message: 'Your .env.local file currently has placeholder values for WHATSAPP_TOKEN and WHATSAPP_PHONE_ID.',
        instructions: [
          '1. Go to https://developers.facebook.com/apps/',
          '2. Select your App -> WhatsApp -> API Setup',
          '3. Copy the "Temporary access token" or your permanent system user token into WHATSAPP_TOKEN in .env.local',
          '4. Copy the "Phone number ID" into WHATSAPP_PHONE_ID in .env.local',
          '5. Add your recipient phone number to the "To" test number list in Meta console',
          '6. Restart the server: npm run start (or npm run dev)',
        ],
      });
    }

    const normalizedTo = normalizePhone(phone);
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    // Try sending Meta's default 'hello_world' template which is always pre-approved by Meta
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      }),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return NextResponse.json({
        success: false,
        reason: 'META_API_ERROR',
        status: metaRes.status,
        metaError: metaData,
        message: metaData?.error?.message || 'Meta rejected the request.',
        tip:
          metaData?.error?.code === 131030
            ? 'Your phone number is not registered in the Allowed Recipients list in Meta Developer Portal.'
            : metaData?.error?.code === 190
            ? 'Your WhatsApp Access Token has expired. Generate a new token in Meta Developer Portal.'
            : 'Check Meta API credentials in .env.local.',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Message sent to ${normalizedTo} via Meta WhatsApp Cloud API!`,
      metaResponse: metaData,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
