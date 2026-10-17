import webpush, { type PushSubscription, type RequestOptions } from "web-push";
import { getVapidConfiguration } from "@/lib/server/push-config";
import {
  deleteNotificationPushSubscriptionByEndpoint,
  listNotificationPushSubscriptionsForUser,
} from "@/lib/server/ride-database";

type DeliveryNotice = {
  userId: string;
  data: { id: string; title: string; message: string; createdAt: string };
};

export async function deliverNotificationPush(
  notice: DeliveryNotice,
  send: (subscription: PushSubscription, payload?: string | Buffer | null, options?: RequestOptions) => Promise<unknown> = webpush.sendNotification,
) {
  if (!getVapidConfiguration()) return;

  const subscriptions = listNotificationPushSubscriptionsForUser(notice.userId);
  await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await send({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, JSON.stringify({
        title: "CabBook ride update",
        body: "You have a new update. Sign in to CabBook to view it.",
        tag: `cabbook-${notice.data.id}`,
        url: "/notifications",
      }), { TTL: 60 * 60 });
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: unknown }).statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) deleteNotificationPushSubscriptionByEndpoint(subscription.endpoint);
    }
  }));
}
