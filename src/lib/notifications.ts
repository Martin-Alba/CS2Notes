import { redis } from "./redis";

const NOTIFICATION_CHANNEL = "notifications";

export async function publishNotification(userId: string, notification: Record<string, unknown>) {
  try {
    await redis.publish(
      `${NOTIFICATION_CHANNEL}:${userId}`,
      JSON.stringify(notification)
    );
  } catch {
    // Redis unavailable — notifications will be picked up via polling
  }
}

export function getNotificationChannel(userId: string): string {
  return `${NOTIFICATION_CHANNEL}:${userId}`;
}
