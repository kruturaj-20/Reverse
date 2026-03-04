// lightweight placeholder for notification logic (push, email, etc.)
import logger from "./logger";

export async function sendPriceDropNotification(
  userId: string,
  productId: string,
  newPrice: number,
  targetPrice: number,
) {
  // In a real system this would enqueue a push notification / email.
  // For now just log – the mobile client could fetch alerts via an API later.
  logger.info(
    `[notification] price drop alert for user ${userId}: product ${productId} hit ${newPrice} (target ${targetPrice})`,
  );
}
