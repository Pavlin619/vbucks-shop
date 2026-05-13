import 'server-only';
import { resend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { escHtml as esc } from '@/lib/html-escape';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@vbucks-shop.com';

async function recordFailedNotification(recipient: string, subject: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('failed_notifications')
    .insert({ recipient, subject });
  if (error) {
    console.error('[services/email] failed to record notification failure', error.message);
  }
}

async function sendToAdmins(
  adminEmails: string[],
  subject: string,
  html: string,
): Promise<void> {
  for (const to of adminEmails) {
    try {
      const { error } = await resend.emails.send({ from: FROM, to, subject, html });
      if (error) {
        console.error('[services/email] send failed', { to, subject, error });
        await recordFailedNotification(to, subject);
      }
    } catch (err) {
      console.error('[services/email] send failed', { to, subject, err });
      await recordFailedNotification(to, subject);
    }
  }
}

export async function sendFriendRequestNeededNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] Friend request needed — ${esc(fortniteUsername)}`,
    `<p>User <strong>${esc(fortniteUsername)}</strong> has set their Fortnite username and is waiting for a friend request.</p>
     <p>Please open Fortnite and send them a friend request so they can start purchasing skins.</p>`,
  );
}

export async function sendVBucksPurchaseNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
  vbucksAmount: number,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] New V-Bucks purchase — ${esc(fortniteUsername)}`,
    `<p><strong>${esc(fortniteUsername)}</strong> purchased <strong>${vbucksAmount.toLocaleString()} V-Bucks</strong>.</p>
     <p>Send them a Fortnite friend request so they can buy skins.</p>`,
  );
}

export async function sendOrderPlacedNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
  skinName: string,
  vbucksCost: number,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] New skin order — ${esc(skinName)}`,
    `<p><strong>${esc(fortniteUsername)}</strong> ordered <strong>${esc(skinName)}</strong> for ${vbucksCost.toLocaleString()} V-Bucks.</p>
     <p>Please gift the item in-game via Fortnite.</p>`,
  );
}

export async function sendOrderFulfilledNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
  skinName: string,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] Order marked as gifted — ${esc(skinName)}`,
    `<p>Order for <strong>${esc(skinName)}</strong> gifted to <strong>${esc(fortniteUsername)}</strong> has been marked as fulfilled.</p>`,
  );
}

export async function sendOrderRefundedNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
  skinName: string,
  vbucksRefunded: number,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] Order refunded — ${esc(skinName)}`,
    `<p>Order for <strong>${esc(skinName)}</strong> for <strong>${esc(fortniteUsername)}</strong> was refunded. ${vbucksRefunded.toLocaleString()} V-Bucks returned to their wallet.</p>`,
  );
}

export async function sendAccountFlaggedNotificationToAdmin(
  adminEmails: string[],
  userIdentifier: string,
  reason: string,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] ALERT: Account flagged — ${esc(userIdentifier)}`,
    `<p><strong>Account flagged:</strong> <code>${esc(userIdentifier)}</code></p>
     <p><strong>Reason:</strong> ${esc(reason)}</p>
     <p>Please review this account in the admin panel and take appropriate action.</p>`,
  );
}
