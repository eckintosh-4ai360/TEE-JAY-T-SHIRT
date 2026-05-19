/**
 * mNotify Quick SMS helper
 * Docs: https://developer.mnotify.com/#tag/SMS/operation/campaign/sms_quick
 */

const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY ?? ''
const MNOTIFY_BASE    = 'https://api.mnotify.com/api/sms/quick'

interface SMSResult {
  ok: boolean
  raw?: unknown
}

/**
 * Send a quick SMS via mNotify to one or more phone numbers.
 * @param recipients  Array of phone numbers (e.g. ["0241234567"])
 * @param message     The message body
 * @param senderId    Sender name/ID (max 11 chars). Defaults to "TeeJay"
 */
export async function sendSMS(
  recipients: string[],
  message: string,
  senderId = 'TEE-JAY MUL'
): Promise<SMSResult> {
  if (!MNOTIFY_API_KEY) {
    console.warn('[SMS] MNOTIFY_API_KEY not set – skipping SMS send')
    return { ok: false }
  }

  // Normalize: strip whitespace from numbers
  const nums = recipients
    .map(r => r.replace(/\s+/g, ''))
    .filter(Boolean)

  if (nums.length === 0) return { ok: false }

  try {
    const res = await fetch(`${MNOTIFY_BASE}?key=${MNOTIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: nums,
        sender: senderId,
        message: message,
        is_schedule: 'false',
        schedule_date: ''
      }),
      // Give it 8s max – don't block the API response too long
      signal: AbortSignal.timeout(8000),
    })
    const raw = await res.json().catch(() => res.text())
    console.log('[SMS] mNotify response:', raw)
    return { ok: res.ok, raw }
  } catch (err) {
    console.error('[SMS] Failed to send SMS:', err)
    return { ok: false }
  }
}

// ─── Pre-built message builders ─────────────────────────────────────────────

export interface OrderSMSContext {
  clientName:      string
  receiptNumber:   string
  serviceLabel:    string
  totalAmount:     string   // formatted e.g. "GH₵ 120.00"
  amountPaid:      string
  balance:         string
  dueDate:         string
  status?:         string
}

/** Sent right after a client books an order */
export function buildOrderConfirmationSMS(ctx: OrderSMSContext): string {
  return (
    `Hi ${ctx.clientName}, your order has been received!\n` +
    `Service: ${ctx.serviceLabel}\n` +
    `Receipt: ${ctx.receiptNumber}\n` +
    `Total: ${ctx.totalAmount} | Paid: ${ctx.amountPaid} | Balance: ${ctx.balance}\n` +
    `Due: ${ctx.dueDate}\n` +
    `Track your order at teejay.vercel.app/track/${ctx.receiptNumber}\n` +
    `Thank you - Tee-Jay Multimedia`
  )
}

/** Sent whenever an admin/worker updates the order status */
export function buildStatusUpdateSMS(ctx: OrderSMSContext): string {
  return (
    `Hi ${ctx.clientName}, your order status has been updated.\n` +
    `Service: ${ctx.serviceLabel}\n` +
    `Status: ${ctx.status}\n` +
    `Receipt: ${ctx.receiptNumber}\n` +
    `Track: teejay.vercel.app/track/${ctx.receiptNumber}\n` +
    `Tee-Jay Multimedia`
  )
}
