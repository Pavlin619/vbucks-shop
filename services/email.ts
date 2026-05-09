import 'server-only';
import { resend } from '@/lib/resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@vbucks-shop.com';

async function sendToAdmins(
  adminEmails: string[],
  subject: string,
  html: string,
): Promise<void> {
  for (const to of adminEmails) {
    try {
      await resend.emails.send({ from: FROM, to, subject, html });
    } catch (err) {
      console.error('[services/email] send failed', { to, subject, err });
    }
  }
}

export async function sendFriendRequestNeededNotificationToAdmin(
  adminEmails: string[],
  fortniteUsername: string,
): Promise<void> {
  await sendToAdmins(
    adminEmails,
    `[VBucks Shop] Friend request needed — ${fortniteUsername}`,
    `<p>User <strong>${fortniteUsername}</strong> has set their Fortnite username and is waiting for a friend request.</p>
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
    `[VBucks Shop] New V-Bucks purchase — ${fortniteUsername}`,
    `<p><strong>${fortniteUsername}</strong> purchased <strong>${vbucksAmount.toLocaleString()} V-Bucks</strong>.</p>
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
    `[VBucks Shop] New skin order — ${skinName}`,
    `<p><strong>${fortniteUsername}</strong> ordered <strong>${skinName}</strong> for ${vbucksCost.toLocaleString()} V-Bucks.</p>
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
    `[VBucks Shop] Order marked as gifted — ${skinName}`,
    `<p>Order for <strong>${skinName}</strong> gifted to <strong>${fortniteUsername}</strong> has been marked as fulfilled.</p>`,
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
    `[VBucks Shop] Order refunded — ${skinName}`,
    `<p>Order for <strong>${skinName}</strong> for <strong>${fortniteUsername}</strong> was refunded. ${vbucksRefunded.toLocaleString()} V-Bucks returned to their wallet.</p>`,
  );
}
