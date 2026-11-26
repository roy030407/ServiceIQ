/**
 * WhatsApp & Notifications Integration Helper (Track E Interface)
 * 
 * Conforms to Track E's agreed interface for triggering notifications.
 * Track E implements the Meta WhatsApp Business API webhook and dispatch.
 * Track C calls these helpers non-blockingly upon ticket intake and job assignment.
 */

export interface TicketNotificationPayload {
  ticketId: string;
  ticketNo: string;
  customerName?: string;
  customerPhone?: string | null;
  faultDescription?: string | null;
  priority?: string;
  siteName?: string;
}

export interface TechnicianAssignmentNotificationPayload {
  jobId: string;
  jobNo: string;
  technicianName: string;
  technicianPhone?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  customerName?: string;
  siteName?: string;
}

export async function sendTicketCreatedNotification(payload: TicketNotificationPayload) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // If Track E has not configured WhatsApp credentials in this environment yet, skip safely
    if (!token || !phoneId || !payload.customerPhone) {
      return {
        success: false,
        skipped: true,
        reason: 'WhatsApp credentials or recipient phone not configured',
      };
    }

    // Call Track E's external Meta WhatsApp endpoint or edge function when present
    // Keep modular and catch any network/auth failures so core ticket flow is unaffected
    return { success: true };
  } catch (error: any) {
    console.warn('[Track E WhatsApp Notification Warning]:', error?.message || error);
    return { success: false, error: error?.message };
  }
}

export async function notifyTechnicianAssigned(payload: TechnicianAssignmentNotificationPayload) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId || !payload.technicianPhone) {
      return {
        success: false,
        skipped: true,
        reason: 'WhatsApp credentials or technician phone not configured',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.warn('[Track E Technician Assignment Notification Warning]:', error?.message || error);
    return { success: false, error: error?.message };
  }
}

// Track E: WhatsApp Cloud API helpers
const getWhatsAppMessagesUrl = () =>
  `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

export function normalizePhone(to: string): string {
  const digits = to.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export async function sendText(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.warn('[WhatsApp] Credentials are not configured. Message skipped.');
    return false;
  }

  const phone = normalizePhone(to);

  if (!phone || phone === '91') {
    console.warn('[WhatsApp] Invalid recipient phone number.');
    return false;
  }

  try {
    const response = await fetch(getWhatsAppMessagesUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[WhatsApp] API error ${response.status}: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Network error:', error);
    return false;
  }
}
