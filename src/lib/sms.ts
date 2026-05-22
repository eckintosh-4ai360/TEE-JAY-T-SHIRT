/**
 * mNotify Quick SMS helper
 * Docs: https://developer.mnotify.com/#tag/SMS/operation/campaign/sms_quick
 */

const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY ?? ''
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID?.trim() || 'TEE-JAY MUL'
const MNOTIFY_BASE = 'https://api.mnotify.com/api/sms/quick'
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
    : '')

interface SMSResult {
  ok: boolean
  error?: string
  raw?: unknown
}

interface MNotifyResponse {
  status?: string
  code?: string | number
  message?: string
}

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D+/g, '')

  if (!digits) return ''
  if (digits.startsWith('233') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `233${digits.slice(1)}`

  return digits
}

function getReceiptUrl(receiptNumber: string): string {
  const path = `/receipt/${receiptNumber}`
  return APP_BASE_URL ? `${APP_BASE_URL}${path}` : path
}

/**
 * Send a quick SMS via mNotify to one or more phone numbers.
 * @param recipients Array of phone numbers (e.g. ["0241234567"])
 * @param message The message body
 * @param senderId Sender name/ID (max 11 chars).
 */
export async function sendSMS(
  recipients: string[],
  message: string,
  senderId = MNOTIFY_SENDER_ID
): Promise<SMSResult> {
  if (!MNOTIFY_API_KEY) {
    console.warn('[SMS] MNOTIFY_API_KEY not set - skipping SMS send')
    return { ok: false, error: 'MNOTIFY_API_KEY not set' }
  }

  if (!senderId) {
    console.warn('[SMS] MNOTIFY_SENDER_ID not set - skipping SMS send')
    return { ok: false, error: 'MNOTIFY_SENDER_ID not set' }
  }

  if (senderId.length > 11) {
    console.warn('[SMS] Sender ID exceeds 11 characters:', senderId)
    return { ok: false, error: 'Sender ID exceeds 11 characters' }
  }

  const nums = recipients.map(normalizePhoneNumber).filter(Boolean)
  if (nums.length === 0) return { ok: false, error: 'No valid recipients' }

  try {
    const res = await fetch(`${MNOTIFY_BASE}?key=${MNOTIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: nums,
        sender: senderId,
        message,
        is_schedule: false,
        schedule_date: '',
      }),
      signal: AbortSignal.timeout(8000),
    })

    const raw = await res.json().catch(() => res.text())
    const parsed = (typeof raw === 'object' && raw !== null ? raw : null) as MNotifyResponse | null
    const isSuccess =
      res.ok &&
      parsed?.status === 'success' &&
      String(parsed?.code ?? '') === '2000'

    if (!isSuccess) {
      console.error('[SMS] mNotify rejected message:', {
        httpStatus: res.status,
        senderId,
        recipients: nums,
        raw,
      })
      return {
        ok: false,
        error: parsed?.message || `HTTP ${res.status}`,
        raw,
      }
    }

    console.log('[SMS] mNotify accepted message:', {
      senderId,
      recipients: nums,
      raw,
    })
    return { ok: true, raw }
  } catch (err) {
    console.error('[SMS] Failed to send SMS:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown SMS error',
    }
  }
}

export interface OrderSMSContext {
  clientName: string
  receiptNumber: string
  serviceLabel: string
  totalAmount: string
  amountPaid: string
  balance: string
  dueDate: string
  status?: string
}

export interface WorkerAssignmentSMSContext {
  workerName: string
  clientName: string
  receiptNumber: string
  serviceLabel: string
  dueDate: string
  description?: string
}

/** Sent right after a client books an order */
export function buildOrderConfirmationSMS(ctx: OrderSMSContext): string {
  return (
    `Hi ${ctx.clientName}, your order has been received!\n` +
    `Service: ${ctx.serviceLabel}\n` +
    `Receipt: ${ctx.receiptNumber}\n` +
    `Total: ${ctx.totalAmount} | Paid: ${ctx.amountPaid} | Balance: ${ctx.balance}\n` +
    `Due: ${ctx.dueDate}\n` +
    `Receipt: ${getReceiptUrl(ctx.receiptNumber)}\n` +
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
    `Receipt: ${getReceiptUrl(ctx.receiptNumber)}\n` +
    `Tee-Jay Multimedia`
  )
}

/** Sent to a worker when admin assigns them to an order */
export function buildWorkerAssignmentSMS(ctx: WorkerAssignmentSMSContext): string {
  const lines = [
    `Hi ${ctx.workerName}, you have been assigned a new job!`,
    `Client: ${ctx.clientName}`,
    `Service: ${ctx.serviceLabel}`,
    `Due: ${ctx.dueDate}`,
  ]
  if (ctx.description) lines.push(`Details: ${ctx.description}`)
  lines.push(
    `Order Receipt: ${getReceiptUrl(ctx.receiptNumber)}`,
    `Tee-Jay Multimedia`,
  )
  return lines.join('\n')
}
